import { NextRequest, NextResponse } from 'next/server';
import { validatePaystackRequest } from '@/lib/webhook-validator';
import { paystackService } from '@/lib/paystack-service';
import { membershipService } from '@/lib/membership-service';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validatePaymentAttempt } from '@/lib/payment-validator';

interface PaymentData {
    userId: string;
    metadata: {
        membershipTier: string;
        securityFee: number;
        refundableAmount: number;
        administrationFee: number;
    };
    amount: number;
    email: string;
    status: string;
}

export async function POST(request: NextRequest) {
    try {
        // Validate webhook signature
        const validationError = await validatePaystackRequest(request);
        if (validationError) return validationError;

        const payload = await request.json();
        const { event, data } = payload;

        // Only process successful charge events
        if (event !== 'charge.success') {
            return NextResponse.json(
                { status: 'ignored', message: 'Not a successful charge event' }
            );
        }

        // Verify the payment with Paystack
        const verification = await paystackService.verifyPayment(data.reference);
        if (!verification.success) {
            return NextResponse.json(
                { status: 'error', message: verification.error },
                { status: 400 }
            );
        }

        // Get payment record
        const paymentDoc = await adminDb?.collection('payments').doc(data.reference).get();
        if (!paymentDoc?.exists) {
            return NextResponse.json(
                { status: 'error', message: 'Payment record not found' },
                { status: 404 }
            );
        }

        const paymentData = paymentDoc.data() as PaymentData;
        if (!paymentData?.userId || !paymentData?.metadata) {
            return NextResponse.json(
                { status: 'error', message: 'Invalid payment data' },
                { status: 400 }
            );
        }

        // Validate payment attempt rate limiting
        const isValidAttempt = await validatePaymentAttempt(paymentData.userId);
        if (!isValidAttempt) {
            return NextResponse.json(
                { status: 'error', message: 'Too many payment attempts' },
                { status: 429 }
            );
        }

        if (paymentData.metadata?.membershipTier) {
            // Start a transaction for atomic updates
            await adminDb?.runTransaction(async (transaction) => {
                // Create transaction record
                const transactionRef = adminDb?.collection('transactions').doc();
                const membershipRef = adminDb?.collection('user_memberships').doc(paymentData.userId);

                if (!transactionRef || !membershipRef) {
                    throw new Error('Failed to create database references');
                }

                // Prepare membership update
                await membershipService.upgradeMembership(paymentData.userId, paymentData.metadata.membershipTier);

                // Create transaction record
                transaction.set(transactionRef, {
                    userId: paymentData.userId,
                    type: 'membership_payment',
                    amount: verification.data?.amount,
                    status: 'completed',
                    reference: data.reference,
                    metadata: paymentData.metadata,
                    createdAt: FieldValue.serverTimestamp()
                });

                // Update payment status
                transaction.update(paymentDoc.ref, {
                    status: 'completed',
                    completedAt: FieldValue.serverTimestamp(),
                    transactionId: transactionRef.id
                });

                // Update user's membership status
                transaction.update(membershipRef, {
                    currentTier: paymentData.metadata.membershipTier,
                    lastPayment: {
                        amount: verification.data?.amount,
                        date: FieldValue.serverTimestamp(),
                        reference: data.reference
                    }
                });
            });
        }

        return NextResponse.json({
            status: 'success',
            message: 'Payment processed successfully'
        });
    } catch (error) {
        console.error('Payment callback error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// For Paystack webhook verification
export async function HEAD(request: NextRequest) {
    return new NextResponse(null, { status: 200 });
}
