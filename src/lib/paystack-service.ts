import { MembershipTier, MEMBERSHIP_TIERS } from './membership-tiers';
import axios from 'axios';
// Import firebase admin differently based on environment
import { paymentMonitoring } from './payment-monitoring';

// Dynamic imports to prevent issues on client-side
let adminDb: any = null;
let FieldValue: any = null;

// This will only execute on the server
if (typeof window === 'undefined') {
  // Server-side only imports
  const admin = require('./firebase-admin');
  const firestore = require('firebase-admin/firestore');
  adminDb = admin.adminDb;
  FieldValue = firestore.FieldValue;
}

interface PaystackConfig {
    publicKey: string;
    testMode: boolean;
}

interface InitializePaymentResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

interface VerifyPaymentResponse {
    status: boolean;
    message: string;
    data: {
        status: string;
        reference: string;
        amount: number;
        metadata?: {
            userId?: string;
            [key: string]: any;
        };
        customer: {
            email: string;
        };
    };
}

interface PaystackMetadata {
    fullName?: string;
    phone?: string;
    referralCode?: string;
    membershipTier?: string;
    metadata?: {
        securityFee: number;
        refundableAmount: number;
        administrationFee: number;
    };
}

interface PaystackResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url?: string;
        reference?: string;
        amount?: number;
        status?: string;
    };
}

class PaystackService {
    private readonly baseUrl = 'https://api.paystack.co';
    private readonly secretKey: string;
    private readonly publicKey: string;

    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
        this.publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
        
        if (!this.secretKey || !this.publicKey) {
            throw new Error('Paystack configuration missing');
        }
    }

    async initializePayment(userId: string, email: string, amount: number, metadata: PaystackMetadata) {
        try {
            // Input validation
            if (!userId) throw new Error('User ID is required');
            if (!email) throw new Error('Email is required');
            if (!amount || amount <= 0) throw new Error('Valid amount is required');
            
            // Validate amount against membership tier
            if (metadata.membershipTier) {
                const tier = MEMBERSHIP_TIERS[metadata.membershipTier as keyof typeof MEMBERSHIP_TIERS];
                if (!tier || amount !== tier.securityFee) {
                    const error = new Error('Invalid payment amount for selected membership tier');
                    // Log the error to our monitoring system
                    await this.logPaymentFailure(userId, error, { amount, tierName: metadata.membershipTier });
                    throw error;
                }
            }

            const response = await axios.post<InitializePaymentResponse>(
                `${this.baseUrl}/transaction/initialize`,
                {
                    email,
                    amount: amount * 100, // Convert to kobo/cents
                    metadata: {
                        ...metadata,
                        userId,
                        payment_type: 'membership_fee'
                    },
                    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Store payment attempt and log analytics
            try {
                await Promise.all([
                    this.logPaymentAttempt(userId, response.data.data.reference, {
                        amount,
                        email,
                        metadata,
                        status: 'initiated'
                    }),
                    paymentMonitoring.logPaymentEvent({
                        userId,
                        paymentId: response.data.data.reference,
                        eventType: 'initiate',
                        amount,
                        metadata
                    })
                ]);
            } catch (logError) {
                // Log but continue - logging failures shouldn't stop the payment process
                console.error('Error logging payment attempt:', logError);
            }

            return response.data;
        } catch (error) {
            // Log failure analytics
            await this.logPaymentFailure(userId, error, { amount, email });

            // If this is the specific tier validation error, rethrow it
            if (error instanceof Error && 
                error.message === 'Invalid payment amount for selected membership tier') {
                throw error;
            }

            console.error('Payment initialization error:', error);
            throw new Error('Failed to initialize payment');
        }
    }
    
    /**
     * Helper method to log payment failures
     */
    private async logPaymentFailure(userId: string, error: any, context: any) {
        try {
            await paymentMonitoring.logPaymentEvent({
                userId,
                paymentId: 'failed_init_' + new Date().getTime(),
                eventType: 'failure',
                amount: context.amount,
                errorDetails: error instanceof Error ? error.message : 'Unknown error',
                metadata: context
            });
        } catch (logError) {
            console.error('Failed to log payment failure:', logError);
        }
    }

    async verifyPayment(reference: string): Promise<{
        success: boolean;
        data?: VerifyPaymentResponse['data'];
        error?: string;
    }> {
        try {
            const response = await axios.get<VerifyPaymentResponse>(
                `${this.baseUrl}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`
                    }
                }
            );

            if (response.data.data.status !== 'success') {
                throw new Error(`Payment verification failed: ${response.data.data.status}`);
            }

            // Update payment record and log success
            await Promise.all([
                this.updatePaymentRecord(reference, {
                    status: 'success',
                    verifiedAt: FieldValue.serverTimestamp()
                }),
                paymentMonitoring.logPaymentEvent({
                    userId: response.data.data.metadata?.userId || 'unknown',
                    paymentId: reference,
                    eventType: 'success',
                    amount: response.data.data.amount / 100, // Convert from kobo/cents
                    metadata: response.data.data.metadata
                })
            ]);

            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            // Update payment record and log failure
            await Promise.all([
                this.updatePaymentRecord(reference, {
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    verifiedAt: FieldValue.serverTimestamp()
                }),
                paymentMonitoring.logPaymentEvent({
                    userId: 'unknown', // We might not have user data in case of verification failure
                    paymentId: reference,
                    eventType: 'failure',
                    errorDetails: error instanceof Error ? error.message : 'Unknown error'
                })
            ]).catch(console.error);

            return {
                success: false,
                error: 'Payment verification failed'
            };
        }
    }

    private async logPaymentAttempt(userId: string, reference: string, data: any) {
        if (!adminDb) throw new Error('Firebase Admin not initialized');

        await adminDb.collection('payments').doc(reference).set({
            userId,
            ...data,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    private async updatePaymentRecord(reference: string, update: any) {
        if (!adminDb) throw new Error('Firebase Admin not initialized');

        await adminDb.collection('payments').doc(reference).update({
            ...update,
            updatedAt: FieldValue.serverTimestamp()
        });
    }

    getPublicKey(): string {
        return this.publicKey;
    }
}

export const paystackService = new PaystackService();