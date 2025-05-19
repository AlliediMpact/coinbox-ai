import { NextRequest, NextResponse } from 'next/server';
import { validatePaystackWebhook, validatePaystackRequest } from '../webhook-validator';
import crypto from 'crypto';

describe('WebhookValidator', () => {
    const mockSecretKey = 'test_secret_key';
    const mockBody = JSON.stringify({
        event: 'charge.success',
        data: {
            reference: 'test_ref_123'
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
            // Generate a valid signature
            const expectedHash = crypto
                .createHmac('sha512', mockSecretKey)
                .update(mockBody)
                .digest('hex');

            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue(expectedHash)
                }
            } as unknown as NextRequest;

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(true);
            expect(mockRequest.headers.get).toHaveBeenCalledWith('x-paystack-signature');
        });

        it('should reject invalid signatures', () => {
            const invalidHash = 'invalid_hash';
            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue(invalidHash)
                }
            } as unknown as NextRequest;

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });

        it('should handle missing signature header', () => {
            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue(null)
                }
            } as unknown as NextRequest;

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });

        it('should handle missing secret key', () => {
            delete process.env.PAYSTACK_SECRET_KEY;

            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue('some_hash')
                }
            } as unknown as NextRequest;

            const result = validatePaystackWebhook(mockRequest, mockBody);
            expect(result).toBe(false);
        });

        it('should handle malformed signatures gracefully', () => {
            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue('not-a-hex-string-!')
                }
            } as unknown as NextRequest;

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
});
