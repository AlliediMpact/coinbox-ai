import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  try {
    const ip = req.ip || 'unknown';
    const auth = getAuth();
    const db = getFirestore();
    let userId = null;

    // Try to get userId from session if available
    try {
      const session = req.cookies.get('session')?.value;
      if (session) {
        userId = JSON.parse(Buffer.from(session.split('.')[1], 'base64').toString()).uid;
      }
    } catch {}

    // Determine request type and corresponding limits
    const isPaymentRequest = req.nextUrl.pathname.includes('/api/payment') || 
                            req.nextUrl.pathname.includes('/auth/payment-callback');
    const isAuthRequest = req.nextUrl.pathname.includes('/auth/signin') || 
                         req.nextUrl.pathname.includes('/api/auth/login');
    
    if (isPaymentRequest || isAuthRequest) {
      const rateLimitRef = doc(db, 'rateLimits', `${ip}-${isAuthRequest ? 'auth' : 'payment'}`);
      const rateLimitDoc = await getDoc(rateLimitRef);
      const now = Date.now();
      const timeWindow = isAuthRequest ? AUTH_WINDOW : PAYMENT_WINDOW;
      const attemptLimit = isAuthRequest ? AUTH_ATTEMPT_LIMIT : PAYMENT_ATTEMPT_LIMIT;

      let record: RateLimitRecord;

      if (rateLimitDoc.exists()) {
        record = rateLimitDoc.data() as RateLimitRecord;
        
        // Reset if window has expired
        if (now - record.firstAttempt > timeWindow) {
          record = {
            count: 1,
            firstAttempt: now,
            lastAttempt: now,
            flaggedCount: 0
          };
        } else {
          // Increment count within window
          record.count++;
          record.lastAttempt = now;
        }

        // Check if limit exceeded
        if (record.count > attemptLimit) {
          // Log suspicious activity
          await setDoc(doc(db, 'suspiciousActivity', `${ip}-${now}`), {
            ip,
            userId,
            type: isAuthRequest ? 'auth_attempt_limit_exceeded' : 'payment_attempt_limit_exceeded',
            timestamp: now,
            attempts: record.count,
            window: timeWindow
          });

          // Increment flag count
          record.flaggedCount = (record.flaggedCount || 0) + 1;

          // Flag user account if threshold exceeded
          if (userId && record.flaggedCount >= FLAG_THRESHOLD) {
            await setDoc(doc(db, 'flaggedUsers', userId), {
              userId,
              flaggedAt: now,
              reason: `Repeated ${isAuthRequest ? 'authentication' : 'payment'} attempt limit exceeded`,
              ip,
              flaggedCount: record.flaggedCount
            }, { merge: true });
          }

          await setDoc(rateLimitRef, record);

          return new NextResponse(JSON.stringify({
            error: isAuthRequest ? 
              'Too many login attempts. Please try again later.' : 
              'Too many payment attempts. Please try again later.'
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((record.firstAttempt + timeWindow - now) / 1000))
            }
          });
        }
      } else {
        // First attempt
        record = {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          flaggedCount: 0
        };
      }

      // Update rate limit record
      await setDoc(rateLimitRef, record);
    }

    // Continue with the request
    return NextResponse.next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    return NextResponse.next();
  }
}