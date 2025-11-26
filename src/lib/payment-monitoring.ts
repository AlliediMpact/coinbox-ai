import { getAdminDb, getFieldValue } from './admin-bridge';

interface PaymentMetrics {
    totalAttempts: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    averageAmount: number;
}

interface PaymentAnalytics {
    userId: string;
    paymentId: string;
    eventType: 'initiate' | 'success' | 'failure' | 'verification' | 'webhook';
    amount?: number;
    metadata?: any;
    timestamp: any;
    errorDetails?: string;
}

class PaymentMonitoringService {
    private readonly metricsCollection = 'payment_metrics';
    private readonly analyticsCollection = 'payment_analytics';

    async logPaymentEvent(analytics: Omit<PaymentAnalytics, 'timestamp'>) {
        // Resolve admin instances at runtime so tests that mock admin can inject
        // the mock before this module executes. This prevents binding to a null
        // admin instance at module load time.
        const adminDb = getAdminDb();
        const FieldValue = getFieldValue();

        // If adminDb/FieldValue aren't available we skip logging (safe no-op)
        let resolvedAdminDb = adminDb;
        let resolvedFieldValue = FieldValue;

        // Try test-local relative require as a last-resort to pick up jest.mock
        if (!resolvedAdminDb) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const mod = require('./firebase-admin');
                if (mod && mod.adminDb) resolvedAdminDb = mod.adminDb;
            } catch (e) {}
        }

        if (!resolvedFieldValue) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const fv = require('firebase-admin/firestore');
                if (fv && fv.FieldValue) resolvedFieldValue = fv.FieldValue;
            } catch (e) {}
        }

        if (!resolvedAdminDb || !resolvedFieldValue) {
            console.warn('Firebase Admin not initialized - skipping payment event logging');
            return;
        }

        try {
            // Create the collections reference
            const analyticsCollection = resolvedAdminDb.collection(this.analyticsCollection);
            if (!analyticsCollection) {
                console.error('Failed to access analytics collection');
                return;
            }

            // Log the event with error handling for each operation
            try {
                await analyticsCollection.add({
                    ...analytics,
                    timestamp: resolvedFieldValue.serverTimestamp()
                });
            } catch (addError) {
                console.error('Failed to add analytics document:', addError);
            }

            // Update global metrics
            try {
                const metricsRef = resolvedAdminDb.collection(this.metricsCollection).doc('global');
                await metricsRef.set({
                    totalAttempts: resolvedFieldValue.increment(1),
                    ...(analytics.eventType === 'success' && {
                        successfulPayments: resolvedFieldValue.increment(1),
                        totalAmount: resolvedFieldValue.increment(analytics.amount || 0)
                    }),
                    ...(analytics.eventType === 'failure' && {
                        failedPayments: resolvedFieldValue.increment(1)
                    }),
                    lastUpdated: resolvedFieldValue.serverTimestamp()
                }, { merge: true });
            } catch (globalError) {
                console.error('Failed to update global metrics:', globalError);
            }

            // Update user-specific metrics
            try {
                if (analytics.userId) {
                    const userMetricsRef = resolvedAdminDb.collection(this.metricsCollection)
                        .doc(`user_${analytics.userId}`);
                    await userMetricsRef.set({
                        totalAttempts: resolvedFieldValue.increment(1),
                        ...(analytics.eventType === 'success' && {
                            successfulPayments: resolvedFieldValue.increment(1),
                            totalAmount: resolvedFieldValue.increment(analytics.amount || 0)
                        }),
                        ...(analytics.eventType === 'failure' && {
                            failedPayments: resolvedFieldValue.increment(1)
                        }),
                        lastUpdated: resolvedFieldValue.serverTimestamp()
                    }, { merge: true });
                }
            } catch (userError) {
                console.error('Failed to update user metrics:', userError);
            }
        } catch (error) {
            console.error('Error logging payment event:', error);
            // Don't throw - monitoring should not break main flow
        }
    }

    async getPaymentMetrics(userId?: string): Promise<PaymentMetrics> {
        // Default metrics in case of any errors
        const defaultMetrics: PaymentMetrics = {
            totalAttempts: 0,
            successfulPayments: 0,
            failedPayments: 0,
            totalAmount: 0,
            averageAmount: 0
        };

        // Resolve admin instances at runtime so tests can inject mocks prior to
        // calling this method (prevents referencing undefined `adminDb`/`FieldValue`).
        const adminDb = getAdminDb();
        const FieldValue = getFieldValue();

        // If adminDb/FieldValue aren't available return default metrics
        let resolvedAdminDb = adminDb;
        let resolvedFieldValue = FieldValue;

        // Try test-local relative require as a last-resort to pick up jest.mock
        if (!resolvedAdminDb) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const mod = require('./firebase-admin');
                if (mod && mod.adminDb) resolvedAdminDb = mod.adminDb;
            } catch (e) {}
        }

        if (!resolvedFieldValue) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const fv = require('firebase-admin/firestore');
                if (fv && fv.FieldValue) resolvedFieldValue = fv.FieldValue;
            } catch (e) {}
        }

        if (!resolvedAdminDb || !resolvedFieldValue) {
            console.warn('Firebase Admin not initialized - returning default payment metrics');
            return defaultMetrics;
        }

        try {
            const docRef = userId 
                ? resolvedAdminDb.collection(this.metricsCollection).doc(`user_${userId}`)
                : resolvedAdminDb.collection(this.metricsCollection).doc('global');

            if (!docRef) {
                console.error('Failed to create document reference');
                return defaultMetrics;
            }

            const doc = await docRef.get();
            
            // Check if doc exists and has data
            if (!doc || !doc.exists || typeof doc.data !== 'function') {
                return defaultMetrics;
            }

            const data = doc.data() as PaymentMetrics;
            
            // Validate data to ensure we have all required fields
            if (!data) {
                return defaultMetrics;
            }

            return {
                totalAttempts: data.totalAttempts || 0,
                successfulPayments: data.successfulPayments || 0,
                failedPayments: data.failedPayments || 0,
                totalAmount: data.totalAmount || 0,
                averageAmount: data.successfulPayments && data.successfulPayments > 0 
                    ? data.totalAmount / data.successfulPayments 
                    : 0
            };
        } catch (error) {
            console.error('Error getting payment metrics:', error);
            return defaultMetrics;
        }
    }
}

export const paymentMonitoring = new PaymentMonitoringService();
