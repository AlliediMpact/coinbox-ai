/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { validatePaystackWebhook } from '@/lib/webhook-validator';
import { adminDb } from '@/lib/firebase-admin';
import * as routes from '@/app/api/payment/analytics/route';
import { getServerSession } from 'next-auth';
import { safeNextResponseJson } from '@/app/api-utils';

jest.mock('next-auth');
jest.mock('@/lib/payment-monitoring', () => ({
    paymentMonitoring: {
        getPaymentMetrics: jest.fn(),
        processWebhookEvent: jest.fn(),
        logPaymentEvent: jest.fn()
    }
}));
jest.mock('@/lib/webhook-validator');
jest.mock('@/app/api-utils');

// Mock the Firebase admin
jest.mock('@/lib/firebase-admin', () => {
    const mockDocument = {
        exists: true,
        data: () => ({ role: 'admin' }),
        id: 'user-doc'
    };
    
    const mockCollection = {
        doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockDocument)
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
            docs: [
                { 
                    id: 'analytics-1',
                    data: () => ({
                        userId: 'test-user-1',
                        amount: 1000,
                        status: 'success'
                    })
                }
            ]
        })
    };
    
    return {
        adminDb: {
            collection: jest.fn().mockImplementation((collectionName) => mockCollection)
        }
    };
});

// Mock the session
(getServerSession as jest.Mock).mockImplementation(() => Promise.resolve({
    user: { id: 'admin-user-id', email: 'admin@example.com' }
}));

// Mock safeNextResponseJson
(safeNextResponseJson as jest.Mock).mockImplementation((data, options = {}) => {
    return {
        status: options?.status || 200,
        json: async () => data
    };
});

describe('Payment Analytics API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/payment/analytics', () => {
        it('should return global metrics when no userId provided', async () => {
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics');
            const mockMetrics = {
                totalAttempts: 100,
                successfulPayments: 80,
                failedPayments: 20,
                totalAmount: 10000,
                averageAmount: 125
            };

            (paymentMonitoring.getPaymentMetrics as jest.Mock).mockResolvedValueOnce(mockMetrics);

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty('metrics');
            expect(data.metrics).toEqual(mockMetrics);
            expect(data).toHaveProperty('analytics');
        });

        it('should return user-specific metrics when userId provided', async () => {
            const mockUserId = 'admin-user-id';
            const mockRequest = new NextRequest(`http://localhost:3000/api/payment/analytics?userId=${mockUserId}`);
            
            const mockMetrics = {
                totalAttempts: 50,
                successfulPayments: 40,
                failedPayments: 10,
                totalAmount: 5000,
                averageAmount: 125
            };

            (paymentMonitoring.getPaymentMetrics as jest.Mock).mockResolvedValueOnce(mockMetrics);

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty('metrics');
            expect(data.metrics).toEqual(mockMetrics);
        });

        it('should handle errors gracefully', async () => {
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics');
            
            (paymentMonitoring.getPaymentMetrics as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
            (safeNextResponseJson as jest.Mock).mockImplementationOnce((data, options = {}) => {
                return {
                    status: options?.status || 500, // Make sure the test can see the correct status code
                    json: async () => data
                };
            });

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data).toEqual({
                error: 'Failed to fetch payment metrics'
            });
        });
    });

    describe('POST /api/payment/analytics/webhook', () => {
        it('should process valid webhook events', async () => {
            const mockBody = {
                event: 'charge.success',
                data: {
                    id: 123456,
                    reference: 'test-ref',
                    amount: 5000,
                    metadata: {
                        userId: 'test-user'
                    }
                }
            };
            
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics/webhook', {
                method: 'POST',
                body: JSON.stringify(mockBody),
                headers: {
                    'x-paystack-signature': 'valid-signature'
                }
            });
            
            (validatePaystackWebhook as jest.Mock).mockReturnValueOnce(true);
            
            const response = await routes.POST(mockRequest);
            const data = await response.json();
            
            expect(response.status).toBe(200);
            expect(data).toEqual({
                status: 'success'
            });
        });

        it('should reject requests with invalid signature', async () => {
            const mockBody = { event: 'test' };
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics/webhook', {
                method: 'POST',
                body: JSON.stringify(mockBody)
            });
            
            (validatePaystackWebhook as jest.Mock).mockReturnValueOnce(false);
            (safeNextResponseJson as jest.Mock).mockImplementationOnce((data, options = {}) => {
                return {
                    status: options?.status || 401,
                    json: async () => data
                };
            });
            
            const response = await routes.POST(mockRequest);
            
            expect(response.status).toBe(401);
            expect(await response.json()).toEqual({
                error: 'Invalid signature'
            });
        });

        it('should handle webhook processing errors', async () => {
            const mockBody = {
                event: 'charge.success',
                data: { reference: 'test-ref' }
            };
            
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics/webhook', {
                method: 'POST',
                body: JSON.stringify(mockBody),
                headers: {
                    'x-paystack-signature': 'valid-signature'
                }
            });
            
            (validatePaystackWebhook as jest.Mock).mockReturnValueOnce(true);
            (paymentMonitoring.processWebhookEvent as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Database error');
            });
            
            (safeNextResponseJson as jest.Mock).mockImplementationOnce((data, options = {}) => {
                return {
                    status: options?.status || 500,
                    json: async () => data
                };
            });
            
            const response = await routes.POST(mockRequest);
            
            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({
                error: 'Failed to process webhook event'
            });
        });
    });
});
