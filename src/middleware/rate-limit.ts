import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from 'firebase-admin/firestore';

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  flaggedCount?: number;
}

const PAYMENT_ATTEMPT_LIMIT = 5; // Max payment attempts per hour
const AUTH_ATTEMPT_LIMIT = 5; // Max login attempts per 15 minutes
const PAYMENT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const AUTH_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const FLAG_THRESHOLD = 3; // Number of times to exceed limit before flagging account

export async function rateLimit(req: NextRequest) {
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

    // Determine request type and corresponding limits
    const isPaymentRequest = req.nextUrl.pathname.includes('/api/payment') || 
                            req.nextUrl.pathname.includes('/auth/payment-callback');
    const isAuthRequest = req.nextUrl.pathname.includes('/api/auth') || 
                         req.nextUrl.pathname.includes('/auth/');
    
    if (isPaymentRequest || isAuthRequest) {
      const rateLimitRef = adminDb.collection('rateLimits').doc(`${ip}-${isAuthRequest ? 'auth' : 'payment'}`);
      const rateLimitDoc = await rateLimitRef.get();
      const now = Date.now();
      const timeWindow = isAuthRequest ? AUTH_WINDOW : PAYMENT_WINDOW;
      const attemptLimit = isAuthRequest ? AUTH_ATTEMPT_LIMIT : PAYMENT_ATTEMPT_LIMIT;

      let record: RateLimitRecord;

      if (rateLimitDoc.exists) {
        record = rateLimitDoc.data() as RateLimitRecord;
        
        // Reset if outside time window
        if (now - record.firstAttempt > timeWindow) {
          record = {
            count: 1,
            firstAttempt: now,
            lastAttempt: now,
            flaggedCount: record.flaggedCount || 0
          };
        } else {
          // Increment within window
          record.count++;
          record.lastAttempt = now;

          // Check if limit exceeded
          if (record.count > attemptLimit) {
            record.flaggedCount = (record.flaggedCount || 0) + 1;
            
            // If repeatedly exceeding limits, flag the account/IP
            if (record.flaggedCount >= FLAG_THRESHOLD && userId) {
              await adminDb.collection('flaggedAccounts').doc(userId).set({
                ip,
                flaggedAt: FieldValue.serverTimestamp(),
                reason: `Exceeded ${isAuthRequest ? 'auth' : 'payment'} rate limit ${FLAG_THRESHOLD} times`
              }, { merge: true });
            }

            await rateLimitRef.set(record);
            return false;
          }
        }
      } else {
        record = {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          flaggedCount: 0
        };
      }

      await rateLimitRef.set(record);
      return true;
    }

    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow request through on error, but log it
  }
}