import { NextRequest, NextResponse } from 'next/server';
import { validatePaystackWebhook, validatePaystackRequest } from '../webhook-validator';
import crypto from 'crypto';

describe('WebhookValidator', () => {
    const mockSecretKey = 'test_secret_key';
    const mockBody = JSON.stringify({
        event: 'charge.success',
        data: {
            id: 123456,
            reference: 'test_ref_123',
            amount: 550000, // 5,500 in minor units
            currency: 'ZAR',
            channel: 'card',
            status: 'success',
            paid_at: '2025-05-19T15:00:00.000Z',
            created_at: '2025-05-19T14:59:00.000Z',
            metadata: {
                userId: 'test_user_123',
                membershipTier: 'Basic',
                payment_type: 'membership_fee'
            },
            customer: {
                id: 987654,
                email: 'test@example.com',
                name: 'Test User'
            }
        }
    });

    beforeEach(() => {
        process.env.PAYSTACK_SECRET_KEY = mockSecretKey;
    });

    afterEach(() => {
        delete process.env.PAYSTACK_SECRET_KEY;
        jest.resetAllMocks();
    });

    describe('validatePaystackWebhook', () => {
        it('should validate webhook signature correctly', () => {
            const expectedHash = crypto
                .createHmac('sha512', mockSecretKey)
                .update(mockBody)
                .digest('hex');

            const mockRequest = new NextRequest('http://localhost:3000', {
                method: 'POST',
                body: mockBody,
                headers: {
                    'x-paystack-signature': expectedHash
                }
            });

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(true);
        });

        it('should reject invalid signatures', () => {
            const invalidHash = 'invalid_hash';
            const mockRequest = new NextRequest('http://localhost:3000', {
                method: 'POST',
                body: mockBody,
                headers: {
                    'x-paystack-signature': invalidHash
                }
            });

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });

        it('should handle missing signature header', () => {
            const mockRequest = new NextRequest('http://localhost:3000', {
                method: 'POST',
                body: mockBody
                // No signature header
            });

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });

        it('should handle missing secret key', () => {
            delete process.env.PAYSTACK_SECRET_KEY;

            const mockRequest = new NextRequest('http://localhost:3000', {
                method: 'POST',
                body: mockBody,
                headers: {
                    'x-paystack-signature': 'some_hash'
                }
            });

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });

        it('should handle malformed signatures gracefully', () => {
            const mockRequest = new NextRequest('http://localhost:3000', {
                method: 'POST',
                body: mockBody,
                headers: {
                    'x-paystack-signature': 'not-a-hex-string-!'
                }
            });

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });
    });

    describe('validatePaystackRequest', () => {
        it('should reject non-POST methods', async () => {
            const mockRequest = new NextRequest('http://example.com', {
                method: 'GET'
            });

            const response = await validatePaystackRequest(mockRequest);
            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(405);
        });

        it('should reject requests with invalid signatures', async () => {
            const mockRequest = new NextRequest('http://example.com', {
                method: 'POST',
                body: mockBody,
                headers: {
                    'x-paystack-signature': 'invalid_signature'
                }
            });

            const response = await validatePaystackRequest(mockRequest);
            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(401);
        });

        it('should return null for valid requests', async () => {
            const validHash = crypto
                .createHmac('sha512', mockSecretKey)
                .update(mockBody)
                .digest('hex');

            const mockRequest = new NextRequest('http://example.com', {
                method: 'POST',
                body: mockBody,
                headers: {
                    'x-paystack-signature': validHash
                }
            });

            const response = await validatePaystackRequest(mockRequest);
            expect(response).toBeNull();
        });

        it('should handle request cloning errors gracefully', async () => {
            const mockRequest = new NextRequest('http://example.com', {
                method: 'POST',
                // Create a request that can't be cloned (e.g., with a destroyed body)
                body: null,
                headers: {
                    'x-paystack-signature': 'some_hash'
                }
            });

            const response = await validatePaystackRequest(mockRequest);
            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(400);
        });

        it('should handle empty request bodies', async () => {
            const mockRequest = new NextRequest('http://example.com', {
                method: 'POST',
                headers: {
                    'x-paystack-signature': 'some_hash'
                }
            });

            const response = await validatePaystackRequest(mockRequest);
            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(400);
        });
    });
});
