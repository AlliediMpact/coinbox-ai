import { MembershipTier, MEMBERSHIP_TIERS } from './membership-tiers';
import { receiptService } from './receipt-service';
import axios from 'axios';

// Environment configuration
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';

interface PaystackConfig {
    publicKey: string;
    secretKey: string;
    testMode: boolean;
}

interface PaymentInitialization {
    email: string;
    amount: number; // in kobo (smallest currency unit)
    reference: string;
    metadata?: {
        userId: string;
        membershipTier?: string;
        custom_fields?: Array<{
            display_name: string;
            variable_name: string;
            value: string;
        }>;
    };
    callback_url?: string;
    channels?: string[];
}

interface PaymentVerification {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: 'success' | 'failed' | 'pending';
        reference: string;
        amount: number;
        message: null | string;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: any;
        fees: number;
        customer: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            customer_code: string;
            phone: string;
        };
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
        };
    };
}

interface WebhookEvent {
    event: 'charge.success' | 'charge.failed' | 'transfer.success' | 'transfer.failed';
    data: PaymentVerification['data'];
}

class EnhancedPaystackService {
    private config: PaystackConfig;
    private baseURL = 'https://api.paystack.co';

    constructor() {
        this.config = {
            publicKey: PAYSTACK_PUBLIC_KEY,
            secretKey: PAYSTACK_SECRET_KEY,
            testMode: !PAYSTACK_SECRET_KEY.startsWith('sk_live_')
        };
    }

    // Initialize payment for membership purchase
    async initializeMembershipPayment(
        userId: string,
        email: string,
        membershipTier: MembershipTier,
        callbackUrl?: string
    ): Promise<{ authorizationUrl: string; reference: string }> {
        try {
            const tierConfig = MEMBERSHIP_TIERS[membershipTier.toLowerCase()];
            if (!tierConfig) {
                throw new Error('Invalid membership tier');
            }

            const reference = `membership_${userId}_${Date.now()}`;
            const amount = tierConfig.securityFee * 100; // Convert to kobo

            const payload: PaymentInitialization = {
                email,
                amount,
                reference,
                metadata: {
                    userId,
                    membershipTier,
                    custom_fields: [
                        {
                            display_name: 'User ID',
                            variable_name: 'user_id',
                            value: userId
                        },
                        {
                            display_name: 'Membership Tier',
                            variable_name: 'membership_tier',
                            value: membershipTier
                        }
                    ]
                },
                callback_url: callbackUrl,
                channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
            };

            const response = await axios.post(
                `${this.baseURL}/transaction/initialize`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.config.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Payment initialization failed');
            }

            return {
                authorizationUrl: response.data.data.authorization_url,
                reference: response.data.data.reference
            };

        } catch (error: any) {
            console.error('Paystack initialization error:', error);
            throw new Error(error.response?.data?.message || 'Payment initialization failed');
        }
    }

    // Verify payment status
    async verifyPayment(reference: string): Promise<PaymentVerification> {
        try {
            const response = await axios.get(
                `${this.baseURL}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.config.secretKey}`
                    }
                }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Payment verification failed');
            }

            return response.data;

        } catch (error: any) {
            console.error('Paystack verification error:', error);
            throw new Error(error.response?.data?.message || 'Payment verification failed');
        }
    }

    // Process successful payment
    async processSuccessfulPayment(paymentData: PaymentVerification['data']): Promise<void> {
        try {
            const { metadata, reference, amount, customer, paid_at } = paymentData;
            const userId = metadata.userId || metadata.custom_fields?.find((f: any) => f.variable_name === 'user_id')?.value;
            const membershipTier = metadata.membershipTier || metadata.custom_fields?.find((f: any) => f.variable_name === 'membership_tier')?.value;

            if (!userId) {
                throw new Error('User ID not found in payment metadata');
            }

            // Generate receipt
            const receiptData = await receiptService.generateReceipt({
                userId,
                type: 'membership_payment',
                amount: amount / 100, // Convert from kobo to Rand
                currency: 'ZAR',
                reference,
                description: `${membershipTier} Membership Payment`,
                paymentMethod: 'Paystack',
                customerInfo: {
                    name: `${customer.first_name} ${customer.last_name}`,
                    email: customer.email,
                    phone: customer.phone
                },
                transactionDate: new Date(paid_at)
            });

            // Update user membership status
            await this.updateUserMembership(userId, membershipTier, reference, receiptData.id);

            console.log(`Membership payment processed for user ${userId}: ${membershipTier}`);

        } catch (error) {
            console.error('Error processing successful payment:', error);
            throw error;
        }
    }

    private async updateUserMembership(
        userId: string, 
        membershipTier: string, 
        paymentReference: string,
        receiptId: string
    ): Promise<void> {
        // This would typically update your user database
        // For now, we'll log the action
        console.log('Updating user membership:', {
            userId,
            membershipTier,
            paymentReference,
            receiptId,
            timestamp: new Date().toISOString()
        });

        // In a real implementation, you would:
        // 1. Update user's membership tier in Firestore
        // 2. Grant appropriate permissions
        // 3. Send confirmation email
        // 4. Update any related services
    }

    // Webhook signature verification
    verifyWebhookSignature(payload: string, signature: string): boolean {
        try {
            const crypto = require('crypto');
            const hash = crypto
                .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
                .update(payload)
                .digest('hex');
            
            return hash === signature;
        } catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }

    // Process webhook events
    async processWebhookEvent(event: WebhookEvent): Promise<void> {
        try {
            switch (event.event) {
                case 'charge.success':
                    await this.processSuccessfulPayment(event.data);
                    break;
                
                case 'charge.failed':
                    console.log('Payment failed:', event.data.reference);
                    // Handle failed payment (notification, cleanup, etc.)
                    break;
                
                case 'transfer.success':
                    console.log('Transfer successful:', event.data.reference);
                    // Handle successful payout
                    break;
                
                case 'transfer.failed':
                    console.log('Transfer failed:', event.data.reference);
                    // Handle failed payout
                    break;
                
                default:
                    console.log('Unhandled webhook event:', event.event);
            }
        } catch (error) {
            console.error('Error processing webhook event:', error);
            throw error;
        }
    }

    // Initialize refund
    async initiateRefund(reference: string, amount?: number): Promise<void> {
        try {
            const payload: any = { transaction: reference };
            if (amount) payload.amount = amount * 100; // Convert to kobo

            const response = await axios.post(
                `${this.baseURL}/refund`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.config.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Refund failed');
            }

            console.log('Refund initiated:', response.data);

        } catch (error: any) {
            console.error('Refund error:', error);
            throw new Error(error.response?.data?.message || 'Refund failed');
        }
    }

    // Get transaction history
    async getTransactionHistory(
        page: number = 1, 
        perPage: number = 50,
        status?: 'success' | 'failed' | 'pending'
    ): Promise<any> {
        try {
            const params: any = { page, perPage };
            if (status) params.status = status;

            const response = await axios.get(`${this.baseURL}/transaction`, {
                headers: {
                    Authorization: `Bearer ${this.config.secretKey}`
                },
                params
            });

            return response.data;

        } catch (error: any) {
            console.error('Error fetching transaction history:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
        }
    }

    // Get public configuration for frontend
    getPublicConfig(): { publicKey: string; testMode: boolean } {
        return {
            publicKey: this.config.publicKey,
            testMode: this.config.testMode
        };
    }

    // Initialize transfer (for commission payouts)
    async initializeTransfer(transferData: {
        amount: number;
        recipient: string;
        reason: string;
        reference: string;
    }): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseURL}/transfer`,
                {
                    source: 'balance',
                    amount: transferData.amount,
                    recipient: transferData.recipient,
                    reason: transferData.reason,
                    reference: transferData.reference
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.config.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Transfer failed');
            }

            console.log('Transfer initiated:', response.data);
            return response.data.data;

        } catch (error: any) {
            console.error('Transfer error:', error);
            throw new Error(error.response?.data?.message || 'Transfer failed');
        }
    }

    // Create transfer recipient
    async createTransferRecipient(recipientData: {
        type: 'nuban' | 'mobile_money' | 'basa';
        name: string;
        account_number: string;
        bank_code: string;
        currency?: string;
    }): Promise<any> {
        try {
            const response = await axios.post(
                `${this.baseURL}/transferrecipient`,
                {
                    ...recipientData,
                    currency: recipientData.currency || 'ZAR'
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.config.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Failed to create recipient');
            }

            return response.data.data;

        } catch (error: any) {
            console.error('Create recipient error:', error);
            throw new Error(error.response?.data?.message || 'Failed to create recipient');
        }
    }

    // Get payment history for a user
    async getPaymentHistory(userId: string): Promise<any[]> {
        try {
            // This would typically query your database for user-specific payments
            // For now, returning a placeholder structure
            // In a real implementation, you'd fetch from your transaction logs
            return [];
        } catch (error: any) {
            console.error('Error fetching payment history:', error);
            throw new Error('Failed to fetch payment history');
        }
    }
}

export const enhancedPaystackService = new EnhancedPaystackService();
export type { PaymentVerification, WebhookEvent, PaymentInitialization };
