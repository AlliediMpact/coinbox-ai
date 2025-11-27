/**
 * @jest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { validatePaystackWebhook } from '@/lib/webhook-validator';
import { adminDb } from '@/lib/firebase-admin';
// import * as routes from '@/app/api/payment/analytics/route';
import { getServerSession } from 'next-auth';
import { safeNextResponseJson } from '@/app/api-utils';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn()
}));

vi.mock('@/lib/payment-monitoring', () => ({
    paymentMonitoring: {
        getPaymentMetrics: vi.fn(),
        processWebhookEvent: vi.fn(),
        logPaymentEvent: vi.fn()
    }
}));
vi.mock('@/lib/webhook-validator', () => ({
    validatePaystackWebhook: vi.fn()
}));
vi.mock('@/app/api-utils', () => ({
    safeNextResponseJson: vi.fn()
}));
vi.mock('@/lib/auth-utils', () => {
    console.log('Mocking auth-utils');
    return {
        hasAdminAccess: vi.fn().mockImplementation(() => {
            console.log('hasAdminAccess called');
            return Promise.resolve(true);
        }),
        getUserRole: vi.fn().mockResolvedValue('admin')
    };
});

// Mock the Firebase admin
vi.mock('@/lib/firebase-admin', () => {
    const mockDocument = {
        exists: true,
        data: () => ({ role: 'admin' }),
        id: 'user-doc'
    };
    
    const mockQuery: any = {
        get: vi.fn().mockResolvedValue({
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
    
    // Setup chaining
    mockQuery.where = vi.fn().mockReturnValue(mockQuery);
    mockQuery.orderBy = vi.fn().mockReturnValue(mockQuery);
    mockQuery.limit = vi.fn().mockReturnValue(mockQuery);
    mockQuery.doc = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(mockDocument)
    });
    mockQuery.add = vi.fn();

    return {
        adminDb: {
            collection: vi.fn().mockReturnValue(mockQuery)
        },
        adminAuth: {
            getUser: vi.fn().mockResolvedValue({ customClaims: { role: 'admin' } }),
            verifyIdToken: vi.fn().mockResolvedValue({ uid: 'admin-user-id', role: 'admin' })
        }
    };
});

// Mock the session
vi.mocked(getServerSession).mockImplementation(() => Promise.resolve({
    user: { id: 'admin-user-id', email: 'admin@example.com' }
}));

// Mock safeNextResponseJson
vi.mocked(safeNextResponseJson).mockImplementation((data, options = {}) => {
    return {
        status: options?.status || 200,
        json: async () => data
    } as any;
});

describe('Payment Analytics API', () => {
    let routes: any;

    beforeEach(async () => {
        vi.resetAllMocks();
        
        // Reset default mocks
        vi.mocked(getServerSession).mockResolvedValue({
            user: { id: 'admin-user-id', email: 'admin@example.com' }
        });
        
        vi.mocked(safeNextResponseJson).mockImplementation((data, options = {}) => {
            return {
                status: options?.status || 200,
                json: async () => data
            } as any;
        });

        // Restore hasAdminAccess
        const authUtils = await import('@/lib/auth-utils');
        vi.mocked(authUtils.hasAdminAccess).mockResolvedValue(true);

        routes = await import('@/app/api/payment/analytics/route');
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

            vi.mocked(paymentMonitoring.getPaymentMetrics).mockResolvedValueOnce(mockMetrics);

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

            vi.mocked(paymentMonitoring.getPaymentMetrics).mockResolvedValueOnce(mockMetrics);

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty('metrics');
            expect(data.metrics).toEqual(mockMetrics);
        });

        it('should handle errors gracefully', async () => {
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics');
            
            vi.mocked(paymentMonitoring.getPaymentMetrics).mockRejectedValueOnce(new Error('Test error'));
            vi.mocked(safeNextResponseJson).mockImplementationOnce((data, options = {}) => {
                return {
                    status: options?.status || 500, // Make sure the test can see the correct status code
                    json: async () => data
                } as any;
            });

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data).toEqual({
                error: 'Failed to fetch payment metrics'
            });
        });
    });
});
