/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { validatePaystackWebhook } from '@/lib/webhook-validator';
import * as routes from '@/app/api/payment/analytics/route';

jest.mock('@/lib/payment-monitoring');
jest.mock('@/lib/webhook-validator');

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
            expect(data).toEqual(mockMetrics);
            expect(paymentMonitoring.getPaymentMetrics).toHaveBeenCalledWith(undefined);
        });

        it('should return user-specific metrics when userId provided', async () => {
            const userId = 'test-user-123';
            const mockRequest = new NextRequest(
                `http://localhost:3000/api/payment/analytics?userId=${userId}`
            );
            const mockMetrics = {
                totalAttempts: 10,
                successfulPayments: 8,
                failedPayments: 2,
                totalAmount: 1000,
                averageAmount: 125
            };

            (paymentMonitoring.getPaymentMetrics as jest.Mock).mockResolvedValueOnce(mockMetrics);

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockMetrics);
            expect(paymentMonitoring.getPaymentMetrics).toHaveBeenCalledWith(userId);
        });

        it('should handle errors gracefully', async () => {
            const mockRequest = new NextRequest('http://localhost:3000/api/payment/analytics');
            const mockError = new Error('Database error');

            (paymentMonitoring.getPaymentMetrics as jest.Mock).mockRejectedValueOnce(mockError);

            const response = await routes.GET(mockRequest);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data).toEqual({
                error: 'Failed to fetch payment metrics'
            });
        });
    });

    describe('POST /api/payment/analytics/webhook', () => {
        const mockWebhookEvent = {
            event: 'charge.success',
            data: {
                reference: 'test-ref-123',
                amount: 1000,
                customer: {
                    email: 'test@example.com'
                },
                metadata: {
                    userId: 'test-user-123'
                }
            }
        };

        it('should process valid webhook events', async () => {
            const mockRequest = new NextRequest(
                'http://localhost:3000/api/payment/analytics/webhook',
                {
                    method: 'POST',
                    body: JSON.stringify(mockWebhookEvent)
                }
            );

            (validatePaystackWebhook as jest.Mock).mockReturnValueOnce(true);
            (paymentMonitoring.logPaymentEvent as jest.Mock).mockResolvedValueOnce(undefined);

            const response = await routes.POST(mockRequest);

            expect(response.status).toBe(200);
            expect(paymentMonitoring.logPaymentEvent).toHaveBeenCalledWith({
                userId: mockWebhookEvent.data.metadata.userId,
                paymentId: mockWebhookEvent.data.reference,
                eventType: 'webhook',
                amount: mockWebhookEvent.data.amount / 100,
                metadata: mockWebhookEvent.data.metadata
            });
        });

        it('should reject invalid webhook signatures', async () => {
            const mockRequest = new NextRequest(
                'http://localhost:3000/api/payment/analytics/webhook',
                {
                    method: 'POST',
                    body: JSON.stringify(mockWebhookEvent)
                }
            );

            (validatePaystackWebhook as jest.Mock).mockReturnValueOnce(false);

            const response = await routes.POST(mockRequest);

            expect(response.status).toBe(401);
            expect(paymentMonitoring.logPaymentEvent).not.toHaveBeenCalled();
        });

        it('should handle webhook processing errors', async () => {
            const mockRequest = new NextRequest(
                'http://localhost:3000/api/payment/analytics/webhook',
                {
                    method: 'POST',
                    body: JSON.stringify(mockWebhookEvent)
                }
            );

            (validatePaystackWebhook as jest.Mock).mockReturnValueOnce(true);
            (paymentMonitoring.logPaymentEvent as jest.Mock).mockRejectedValueOnce(
                new Error('Database error')
            );

            const response = await routes.POST(mockRequest);

            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({
                error: 'Failed to process webhook event'
            });
        });
    });
});
