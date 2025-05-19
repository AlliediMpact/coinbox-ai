import { paymentMonitoring } from '../payment-monitoring';
import { adminDb } from '../firebase-admin';

jest.mock('../firebase-admin', () => ({
    adminDb: {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        add: jest.fn().mockResolvedValue(true),
        set: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
                totalAttempts: 10,
                successfulPayments: 8,
                failedPayments: 2,
                totalAmount: 1000
            })
        })
    }
}));

describe('PaymentMonitoringService', () => {
    const mockUserId = 'test-user-123';
    const mockPaymentId = 'test-payment-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logPaymentEvent', () => {
        it('should log payment initiation event', async () => {
            await paymentMonitoring.logPaymentEvent({
                userId: mockUserId,
                paymentId: mockPaymentId,
                eventType: 'initiate',
                amount: 100,
                metadata: { membershipTier: 'Basic' }
            });

            expect(adminDb.collection).toHaveBeenCalledWith('payment_analytics');
            expect(adminDb.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    paymentId: mockPaymentId,
                    eventType: 'initiate',
                    amount: 100
                })
            );
        });

        it('should update global metrics on successful payment', async () => {
            await paymentMonitoring.logPaymentEvent({
                userId: mockUserId,
                paymentId: mockPaymentId,
                eventType: 'success',
                amount: 100
            });

            expect(adminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(adminDb.doc).toHaveBeenCalledWith('global');
            expect(adminDb.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalAttempts: expect.any(Object), // FieldValue.increment
                    successfulPayments: expect.any(Object),
                    totalAmount: expect.any(Object)
                }),
                expect.any(Object)
            );
        });

        it('should update user-specific metrics on failed payment', async () => {
            await paymentMonitoring.logPaymentEvent({
                userId: mockUserId,
                paymentId: mockPaymentId,
                eventType: 'failure',
                errorDetails: 'Test error'
            });

            expect(adminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(adminDb.doc).toHaveBeenCalledWith(`user_${mockUserId}`);
            expect(adminDb.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalAttempts: expect.any(Object),
                    failedPayments: expect.any(Object)
                }),
                expect.any(Object)
            );
        });
    });

    describe('getPaymentMetrics', () => {
        it('should return global metrics when no userId provided', async () => {
            const metrics = await paymentMonitoring.getPaymentMetrics();

            expect(adminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(adminDb.doc).toHaveBeenCalledWith('global');
            expect(metrics).toEqual({
                totalAttempts: 10,
                successfulPayments: 8,
                failedPayments: 2,
                totalAmount: 1000,
                averageAmount: 125 // 1000 / 8
            });
        });

        it('should return user-specific metrics when userId provided', async () => {
            const metrics = await paymentMonitoring.getPaymentMetrics(mockUserId);

            expect(adminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(adminDb.doc).toHaveBeenCalledWith(`user_${mockUserId}`);
            expect(metrics).toEqual({
                totalAttempts: 10,
                successfulPayments: 8,
                failedPayments: 2,
                totalAmount: 1000,
                averageAmount: 125
            });
        });

        it('should return zero metrics for non-existent records', async () => {
            jest.spyOn(adminDb, 'get').mockResolvedValueOnce({
                exists: false,
                data: () => null
            } as any);

            const metrics = await paymentMonitoring.getPaymentMetrics(mockUserId);

            expect(metrics).toEqual({
                totalAttempts: 0,
                successfulPayments: 0,
                failedPayments: 0,
                totalAmount: 0,
                averageAmount: 0
            });
        });
    });
});
