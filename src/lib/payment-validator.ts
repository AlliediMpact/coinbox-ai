// Conditionally import server-side dependencies
let fetch: any;
let adminDb: any;
let FieldValue: any;

if (typeof window === 'undefined') {
  // Server-side only imports
  fetch = require('node-fetch').default;
  const admin = require('./firebase-admin');
  adminDb = admin.adminDb;
  const firestore = require('firebase-admin/firestore');
  FieldValue = firestore.FieldValue;
} else {
  // Browser-side stubs
  console.warn('Payment validator should only be used on the server!');
}

interface PaymentAttempt {
    count: number;
    firstAttempt: Date;
    lastAttempt: Date;
}

interface PaystackVerificationResponse {
    status: boolean;
    message: string;
    data: {
        amount: number;
        currency: string;
        transaction_date: string;
        status: string;
        reference: string;
        metadata: any;
        customer: {
            email: string;
        }
    }
}

/**
 * Validates a payment reference with Paystack API
 * @param reference Payment reference from Paystack
 * @param expectedAmountKobo Expected amount in kobo (cents)
 * @returns Success status and error message if applicable
 */
export async function validatePaymentServer(reference: string, expectedAmountKobo: number): 
    Promise<{success: boolean, error?: string}> {
    
    try {
        // Verify the payment with Paystack API
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            console.error('Missing Paystack secret key');
            return { success: false, error: 'Payment service configuration error' };
        }

        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Paystack verification error:', errorText);
            return { success: false, error: 'Payment verification failed' };
        }

        const result = await response.json() as PaystackVerificationResponse;

        // Check payment status
        if (!result.status || result.data.status !== 'success') {
            return { success: false, error: 'Payment was not successful' };
        }

        // Check payment amount
        if (result.data.amount !== expectedAmountKobo) {
            console.warn(`Payment amount mismatch: expected ${expectedAmountKobo}, got ${result.data.amount}`);
            return { 
                success: false, 
                error: `Payment amount mismatch: expected R${expectedAmountKobo/100}, got R${result.data.amount/100}` 
            };
        }

        // Payment verification successful
        return { success: true };
    } catch (error) {
        console.error('Payment validation error:', error);
        return { success: false, error: 'Error validating payment' };
    }
}

/**
 * Validates payment attempt frequency to prevent abuse
 * @param userId User ID or temporary ID for rate limiting
 * @returns Whether the attempt is allowed
 */
export async function validatePaymentAttempt(userId: string): Promise<boolean> {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const MAX_ATTEMPTS = 5; // Maximum payment attempts per hour
    const WINDOW_SIZE = 60 * 60 * 1000; // 1 hour in milliseconds

    const attemptsRef = adminDb.collection('paymentAttempts').doc(userId);
    const now = new Date();

    try {
        const doc = await attemptsRef.get();
        if (!doc.exists) {
            // First attempt
            await attemptsRef.set({
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
            return true;
        }

        const data = doc.data() as PaymentAttempt;
        const windowStart = new Date(data.firstAttempt.seconds * 1000);
        const timeDiff = now.getTime() - windowStart.getTime();

        if (timeDiff > WINDOW_SIZE) {
            // Reset window
            await attemptsRef.set({
                count: 1,
                firstAttempt: now,
                lastAttempt: now
            });
            return true;
        }

        if (data.count >= MAX_ATTEMPTS) {
            // Log suspicious activity
            await adminDb.collection('suspiciousActivity').add({
                userId,
                type: 'excessive_payment_attempts',
                count: data.count,
                timestamp: FieldValue.serverTimestamp()
            });
            return false;
        }

        // Increment attempt count
        await attemptsRef.update({
            count: FieldValue.increment(1),
            lastAttempt: now
        });

        return true;
    } catch (error) {
        console.error('Error validating payment attempt:', error);
        return false;
    }
}
