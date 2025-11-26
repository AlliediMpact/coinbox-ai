import { paymentMonitoring } from '../payment-monitoring';
import { resetAdminCache } from '../admin-bridge';

// Define mocks
const mockAdminDb = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    add: jest.fn().mockResolvedValue(true),
    set: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
            totalAttempts: 10,
            successfulPayments: 8,
            failedPayments: 2,
            totalAmount: 1000
        })
    })
};

const mockFieldValue = {
    serverTimestamp: jest.fn(),
    increment: jest.fn()
};

// Inject mocks into global scope for admin-bridge to pick up
// This bypasses the need to mock the module directly and works with the bridge's fallback logic
(globalThis as any).adminDb = mockAdminDb;
(globalThis as any).FieldValue = mockFieldValue;

describe('PaymentMonitoringService', () => {
    const mockUserId = 'test-user-123';
    const mockPaymentId = 'test-payment-123';

    beforeEach(() => {
        jest.clearAllMocks();
        // Ensure globals are set before each test
        (globalThis as any).adminDb = mockAdminDb;
        (globalThis as any).FieldValue = mockFieldValue;
        resetAdminCache();
    });

    afterAll(() => {
        delete (globalThis as any).adminDb;
        delete (globalThis as any).FieldValue;
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

            expect(mockAdminDb.collection).toHaveBeenCalledWith('payment_analytics');
            expect(mockAdminDb.add).toHaveBeenCalledWith(
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

            expect(mockAdminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(mockAdminDb.doc).toHaveBeenCalledWith('global');
            expect(mockAdminDb.set).toHaveBeenCalledWith(
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

            expect(mockAdminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(mockAdminDb.doc).toHaveBeenCalledWith(`user_${mockUserId}`);
            expect(mockAdminDb.set).toHaveBeenCalledWith(
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

            expect(mockAdminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(mockAdminDb.doc).toHaveBeenCalledWith('global');
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

            expect(mockAdminDb.collection).toHaveBeenCalledWith('payment_metrics');
            expect(mockAdminDb.doc).toHaveBeenCalledWith(`user_${mockUserId}`);
            expect(metrics).toEqual({
                totalAttempts: 10,
                successfulPayments: 8,
                failedPayments: 2,
                totalAmount: 1000,
                averageAmount: 125
            });
        });

        it('should return zero metrics for non-existent records', async () => {
            // We need to override the mock implementation for this test
            mockAdminDb.get.mockResolvedValueOnce({
                exists: false,
                data: () => null
            });

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
