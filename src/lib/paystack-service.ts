import { MembershipTier, MEMBERSHIP_TIERS } from './membership-tiers';
import axios from 'axios';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { paymentMonitoring } from './payment-monitoring';

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
            // Validate amount against membership tier
            if (metadata.membershipTier) {
                const tier = MEMBERSHIP_TIERS[metadata.membershipTier as keyof typeof MEMBERSHIP_TIERS];
                if (!tier || amount !== tier.securityFee) {
                    throw new Error('Invalid payment amount for selected membership tier');
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

            return response.data;
        } catch (error) {
            // Log failure analytics
            await paymentMonitoring.logPaymentEvent({
                userId,
                paymentId: 'failed_init',
                eventType: 'failure',
                amount,
                errorDetails: error instanceof Error ? error.message : 'Unknown error'
            }).catch(console.error);

            console.error('Payment initialization error:', error);
            throw new Error('Failed to initialize payment');
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