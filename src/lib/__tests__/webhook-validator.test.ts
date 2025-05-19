import { NextRequest } from 'next/server';
import { validatePaystackWebhook } from '../webhook-validator';
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
});
