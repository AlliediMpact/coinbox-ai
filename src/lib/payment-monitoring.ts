import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
        if (!adminDb) {
            console.warn('Firebase Admin not initialized - unable to log payment event');
            return;
        }

        try {
            // Create the collections reference
            const analyticsCollection = adminDb.collection(this.analyticsCollection);
            if (!analyticsCollection) {
                console.error('Failed to access analytics collection');
                return;
            }

            // Log the event with error handling for each operation
            try {
                await analyticsCollection.add({
                    ...analytics,
                    timestamp: FieldValue.serverTimestamp()
                });
            } catch (addError) {
                console.error('Failed to add analytics document:', addError);
            }

            // Update global metrics
            try {
                const metricsRef = adminDb.collection(this.metricsCollection).doc('global');
                await metricsRef.set({
                    totalAttempts: FieldValue.increment(1),
                    ...(analytics.eventType === 'success' && {
                        successfulPayments: FieldValue.increment(1),
                        totalAmount: FieldValue.increment(analytics.amount || 0)
                    }),
                    ...(analytics.eventType === 'failure' && {
                        failedPayments: FieldValue.increment(1)
                    }),
                    lastUpdated: FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (globalError) {
                console.error('Failed to update global metrics:', globalError);
            }

            // Update user-specific metrics
            try {
                if (analytics.userId) {
                    const userMetricsRef = adminDb.collection(this.metricsCollection)
                        .doc(`user_${analytics.userId}`);
                    await userMetricsRef.set({
                        totalAttempts: FieldValue.increment(1),
                        ...(analytics.eventType === 'success' && {
                            successfulPayments: FieldValue.increment(1),
                            totalAmount: FieldValue.increment(analytics.amount || 0)
                        }),
                        ...(analytics.eventType === 'failure' && {
                            failedPayments: FieldValue.increment(1)
                        }),
                        lastUpdated: FieldValue.serverTimestamp()
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

        if (!adminDb) {
            console.warn('Firebase Admin not initialized - unable to get payment metrics');
            return defaultMetrics;
        }

        try {
            const docRef = userId 
                ? adminDb.collection(this.metricsCollection).doc(`user_${userId}`)
                : adminDb.collection(this.metricsCollection).doc('global');

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
