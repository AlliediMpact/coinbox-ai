import { MembershipTier, MEMBERSHIP_TIERS } from './membership-tiers';
import axios from 'axios';

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
    private readonly secretKey: string;
    private readonly publicKey: string;
    private readonly baseUrl: string = 'https://api.paystack.co';

    constructor() {
        this.secretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY || '';
        this.publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
    }

    async initializePayment(email: string, amount: number, metadata: PaystackMetadata): Promise<PaystackResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    email,
                    amount: amount * 100, // Convert to lowest currency unit (kobo/cents)
                    metadata,
                    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment-callback`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Payment initialization failed');
        }
    }

    async verifyPayment(reference: string): Promise<PaystackResponse> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                    },
                }
            );

            return {
                status: true,
                message: 'Verification successful',
                data: {
                    amount: response.data.data.amount,
                    status: response.data.data.status,
                    reference: response.data.data.reference,
                },
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Payment verification failed');
        }
    }

    async initiateTransfer(
        amount: number,
        recipient: string,
        reason: string
    ): Promise<PaystackResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transfer`,
                {
                    source: 'balance',
                    amount: amount * 100,
                    recipient,
                    reason,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Transfer initiation failed');
        }
    }

    async createTransferRecipient(
        type: string,
        name: string,
        accountNumber: string,
        bankCode: string
    ): Promise<PaystackResponse> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/transferrecipient`,
                {
                    type,
                    name,
                    account_number: accountNumber,
                    bank_code: bankCode,
                    currency: 'ZAR',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Recipient creation failed');
        }
    }
}

export const paystackService = new PaystackService();