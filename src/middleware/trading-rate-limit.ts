// Trading Rate Limit Middleware
// Extends the base rate limiting functionality to provide specific limits for trading operations

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './rate-limit';
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';

interface TradingRateLimitRecord {
  count: number;
  amount: number;
  firstAttempt: number;
  lastAttempt: number;
  flaggedCount?: number;
}

// Rate limiting thresholds for trading operations
const TRADE_CREATE_LIMIT = 10; // Max new tickets per hour
const TRADE_MATCH_LIMIT = 15; // Max match attempts per hour
const TRADE_CONFIRM_LIMIT = 20; // Max confirmations per hour
const TRADE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const TRADE_AMOUNT_LIMIT = 50000; // Maximum amount in a single hour
const FLAG_THRESHOLD = 3; // Number of times to exceed limit before flagging account

export async function tradingRateLimit(reqOrOperation: any, maybeOperation?: 'create' | 'match' | 'confirm') {
  // Support two call styles:
  // 1) Curried: tradingRateLimit('create')(req, res, next) -> tests expect this
  // 2) Direct: tradingRateLimit(req, 'create') -> original implementation
  if (typeof reqOrOperation === 'string') {
    const operationType = reqOrOperation as 'create' | 'match' | 'confirm';
    return async (req: any, res: any, next?: any) => {
      try {
        const allowed = await tradingRateLimit(req, operationType);
        if (typeof next === 'function') {
          if (allowed) return next();
          return next(new Error('Rate limit exceeded'));
        }
        return allowed;
      } catch (err) {
        if (typeof next === 'function') return next(err);
        return true;
      }
    };
  }

  const req = reqOrOperation;
  const operationType = maybeOperation as 'create' | 'match' | 'confirm';

  if (!adminDb) {
    console.error('Firebase Admin not initialized');
    return false;
  }

  try {
    const ip = req.ip || 'unknown';
    let userId = null;

    // Try to get userId from session if available
    try {
      const session = req.cookies.get('session')?.value;
      if (session) {
        const decodedToken = await adminAuth?.verifySessionCookie(session);
        userId = decodedToken?.uid;
      }
    } catch (error) {
      console.error('Session verification error:', error);
    }

    // If no userId, rate limit based on IP
    const rateLimitKey = userId || ip;
    const rateLimitRef = adminDb.collection('tradingRateLimits').doc(`${rateLimitKey}-${operationType}`);
    const rateLimitDoc = await rateLimitRef.get();
    const now = Date.now();

    // Determine the appropriate limit based on operation type
    let operationLimit;
    switch (operationType) {
      case 'create':
        operationLimit = TRADE_CREATE_LIMIT;
        break;
      case 'match':
        operationLimit = TRADE_MATCH_LIMIT;
        break;
      case 'confirm':
        operationLimit = TRADE_CONFIRM_LIMIT;
        break;
      default:
        operationLimit = TRADE_CREATE_LIMIT;
    }

    let record: TradingRateLimitRecord;

    if (rateLimitDoc.exists) {
      record = rateLimitDoc.data() as TradingRateLimitRecord;
      
      // Reset if outside time window
      if (now - record.firstAttempt > TRADE_WINDOW) {
        record = {
          count: 1,
          amount: getRequestAmount(req), // Get amount from request
          firstAttempt: now,
          lastAttempt: now,
          flaggedCount: record.flaggedCount || 0
        };
      } else {
        // Increment within window
        record.count++;
        record.amount += getRequestAmount(req);
        record.lastAttempt = now;

        // Check if limit exceeded (either count-based or amount-based)
        if (record.count > operationLimit || record.amount > TRADE_AMOUNT_LIMIT) {
          record.flaggedCount = (record.flaggedCount || 0) + 1;
          
          // If repeatedly exceeding limits, flag the account/IP
          if (record.flaggedCount >= FLAG_THRESHOLD && userId) {
            await adminDb.collection('flaggedAccounts').doc(userId).set({
              ip,
              flaggedAt: FieldValue.serverTimestamp(),
              reason: `Exceeded trading ${operationType} rate limit ${FLAG_THRESHOLD} times`,
              operation: operationType,
              limitTriggered: record.count > operationLimit ? 'count' : 'amount'
            }, { merge: true });
            
            // Also create security event for admin review
            await adminDb.collection('securityEvents').add({
              userId,
              ip,
              eventType: 'trading_rate_limit_exceeded',
              details: {
                operation: operationType,
                count: record.count,
                amount: record.amount,
                limit: operationLimit,
                amountLimit: TRADE_AMOUNT_LIMIT
              },
              timestamp: FieldValue.serverTimestamp(),
              reviewed: false
            });
          }

          await rateLimitRef.set(record);
          return false;
        }
      }
    } else {
      // First attempt
      record = {
        count: 1,
        amount: getRequestAmount(req),
        firstAttempt: now,
        lastAttempt: now,
        flaggedCount: 0
      };
    }

    await rateLimitRef.set(record);
    return true;
  } catch (error) {
    console.error('Trading rate limiting error:', error);
    return true; // Allow request through on error, but log it
  }
}

// Extract amount from request body
// This is a helper function that attempts to get the transaction amount from the request
function getRequestAmount(req: NextRequest): number {
  try {
    if (req.body) {
      const bodyText = req.body.toString();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        if (body.amount && typeof body.amount === 'number') {
          return body.amount;
        }
      }
    }
    
    // If we can't extract from body, try URL search params for GET requests
    const amountParam = req.nextUrl.searchParams.get('amount');
    if (amountParam) {
      const amount = parseFloat(amountParam);
      if (!isNaN(amount)) {
        return amount;
      }
    }
  } catch (error) {
    console.error('Error extracting amount from request:', error);
  }
  
  return 0; // Default to 0 if can't find amount
}

// Middleware function to apply trading rate limiting to API routes
export async function tradingRateLimitMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define patterns for different trading operations
  const isCreateOperation = pathname.includes('/api/trading/create') || 
                           pathname.includes('/api/tickets/create');
                           
  const isMatchOperation = pathname.includes('/api/trading/match') || 
                          pathname.includes('/api/tickets/match');
                          
  const isConfirmOperation = pathname.includes('/api/trading/confirm') || 
                            pathname.includes('/api/tickets/confirm') ||
                            pathname.includes('/api/escrow/release');

  // Apply appropriate rate limiting based on operation
  if (isCreateOperation) {
    const isAllowed = await tradingRateLimit(request, 'create');
    
    if (!isAllowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Rate limit exceeded for creating trading tickets. Please try again later.' 
      }, { status: 429 });
    }
  } else if (isMatchOperation) {
    const isAllowed = await tradingRateLimit(request, 'match');
    
    if (!isAllowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rate limit exceeded for matching trades. Please try again later.'
      }, { status: 429 });
    }
  } else if (isConfirmOperation) {
    const isAllowed = await tradingRateLimit(request, 'confirm');
    
    if (!isAllowed) {
      return NextResponse.json({ 
        success: false,
        error: 'Rate limit exceeded for confirming trades. Please try again later.' 
      }, { status: 429 });
    }
  }
  
  // Continue with normal request handling
  return NextResponse.next();
}

// Export the config for the middleware
export const config = {
  matcher: [
    '/api/trading/:path*',
    '/api/tickets/:path*',
    '/api/escrow/:path*',
  ]
};
