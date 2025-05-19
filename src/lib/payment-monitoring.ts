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
        if (!adminDb) throw new Error('Firebase Admin not initialized');

        try {
            // Log the event
            await adminDb.collection(this.analyticsCollection).add({
                ...analytics,
                timestamp: FieldValue.serverTimestamp()
            });

            // Update metrics
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

            // Update user-specific metrics
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
        } catch (error) {
            console.error('Error logging payment event:', error);
            // Don't throw - monitoring should not break main flow
        }
    }

    async getPaymentMetrics(userId?: string): Promise<PaymentMetrics> {
        if (!adminDb) throw new Error('Firebase Admin not initialized');

        try {
            const docRef = userId 
                ? adminDb.collection(this.metricsCollection).doc(`user_${userId}`)
                : adminDb.collection(this.metricsCollection).doc('global');

            const doc = await docRef.get();
            if (!doc.exists) {
                return {
                    totalAttempts: 0,
                    successfulPayments: 0,
                    failedPayments: 0,
                    totalAmount: 0,
                    averageAmount: 0
                };
            }

            const data = doc.data() as PaymentMetrics;
            return {
                ...data,
                averageAmount: data.successfulPayments > 0 
                    ? data.totalAmount / data.successfulPayments 
                    : 0
            };
        } catch (error) {
            console.error('Error getting payment metrics:', error);
            throw error;
        }
    }
}

export const paymentMonitoring = new PaymentMonitoringService();
