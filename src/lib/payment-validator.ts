import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface PaymentAttempt {
    count: number;
    firstAttempt: Date;
    lastAttempt: Date;
}

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
