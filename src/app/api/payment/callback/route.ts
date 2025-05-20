import { NextRequest, NextResponse } from 'next/server';
import { validatePaystackRequest } from '@/lib/webhook-validator';
import { paystackService } from '@/lib/paystack-service';
import { membershipService } from '@/lib/membership-service';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validatePaymentAttempt } from '@/lib/payment-validator';
import { getServerSession } from 'next-auth';
import { hasAdminAccess } from '@/lib/auth-utils';

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
        if (!adminDb) {
            console.error('Firebase Admin SDK not initialized');
            return NextResponse.json(
                { status: 'error', message: 'Server configuration error' },
                { status: 500 }
            );
        }

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
        const paymentDoc = await adminDb.collection('payments').doc(data.reference).get();
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
            await adminDb.runTransaction(async (transaction) => {
                // Create transaction record
                // Using the non-null assertion operator since we've already checked adminDb above
                const transactionRef = adminDb!.collection('transactions').doc();
                const membershipRef = adminDb!.collection('user_memberships').doc(paymentData.userId);

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
                    verificationData: verification.data
                });
            });

            // Return success response
            return NextResponse.json({
                status: 'success',
                message: 'Payment processed successfully'
            });
        } else {
            return NextResponse.json(
                { status: 'error', message: 'Missing required metadata' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Payment callback error:', error);
        return NextResponse.json(
            { status: 'error', message: 'An internal server error occurred' },
            { status: 500 }
        );
    }
}

// Add a GET endpoint that requires admin/support to view payment information
export async function GET(request: NextRequest) {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }
        
        const session = await getServerSession();
        let currentUserId: string | undefined = undefined;

        if (session?.user && (session.user as any).id) {
            currentUserId = (session.user as any).id;
        } else if (session?.user && (session.user as any).sub) {
            currentUserId = (session.user as any).sub;
        }

        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized: User not logged in.' }, { status: 401 });
        }

        // Check if user has at least support access
        if (!(await hasAdminAccess(currentUserId))) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin or Support role required.' }, 
                { status: 403 }
            );
        }
        
        const url = new URL(request.url);
        const reference = url.searchParams.get('reference');
        const userId = url.searchParams.get('userId');
        const limitParam = parseInt(url.searchParams.get('limit') || '50');
        const limit = isNaN(limitParam) || limitParam <= 0 ? 50 : limitParam;
        
        if (reference) {
            // Specific payment lookup
            const paymentDoc = await adminDb.collection('payments').doc(reference).get();
            if (!paymentDoc.exists) {
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }
            return NextResponse.json({ payment: { id: paymentDoc.id, ...paymentDoc.data() } });
        } 
        
        // Collection query - need to keep reference to collection for type consistency
        const paymentsRef = adminDb.collection('payments');
        let paymentsQuery = paymentsRef.orderBy('createdAt', 'desc').limit(limit);
        
        // Add user filter if provided
        if (userId) {
            paymentsQuery = paymentsRef.where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(limit);
        }
        
        const payments = await paymentsQuery.get();
        const results = payments.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return NextResponse.json({ payments: results });
        
    } catch (error: any) {
        console.error('Payment GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
