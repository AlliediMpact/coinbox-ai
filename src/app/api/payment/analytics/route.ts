import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { validatePaystackWebhook } from '@/lib/webhook-validator';
import { safeNextResponseJson } from '@/app/api-utils';

// Helper function to check admin status
async function isAdmin(userId: string) {
    try {
        if (!adminDb) return false;
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        return userData?.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const userId = searchParams.get('userId');
        const type = searchParams.get('type') || 'all';

        // Get session for auth check
        const session = await getServerSession();
        
        // Only allow admins to view other users' data
        if (userId && (!session?.user || (session.user.id !== userId && !(await isAdmin(session.user.id))))) {
            return safeNextResponseJson(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get metrics
        const metrics = await paymentMonitoring.getPaymentMetrics(userId || undefined);

        // Get detailed analytics if requested
        let analytics = [];
        if (type !== 'metrics' && adminDb) {
            try {
                let analyticsQuery = adminDb.collection('payment_analytics')
                    .orderBy('timestamp', 'desc')
                    .limit(100);

                if (userId) {
                    analyticsQuery = analyticsQuery.where('userId', '==', userId);
                }

                const analyticsSnapshot = await analyticsQuery.get();
                
                if (analyticsSnapshot && analyticsSnapshot.docs) {
                    analytics = analyticsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                }
            } catch (analyticsError) {
                console.error('Error fetching analytics:', analyticsError);
                // Don't fail the whole request if analytics fail
            }
        }

        return safeNextResponseJson({
            metrics,
            analytics: type !== 'metrics' ? analytics : undefined
        });
    } catch (error) {
        console.error('Payment analytics error:', error);
        return safeNextResponseJson(
            { error: 'Failed to fetch payment metrics' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Clone request for reading body twice (once for validation, once for processing)
        const clone = request.clone();
        const body = await clone.text();
        
        if (!body) {
            return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
        }

        // Parse the JSON body
        let payload;
        try {
            payload = JSON.parse(body);
        } catch (parseError) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        // Validate webhook signature
        if (!validatePaystackWebhook(request, body)) {
            console.error('Invalid webhook signature');
            return safeNextResponseJson({ error: 'Invalid signature' }, { status: 401 });
        }
        
        // Safety checks for required fields
        if (!payload?.data?.metadata?.userId || !payload.data.reference) {
            return NextResponse.json(
                { error: 'Missing required payment data' },
                { status: 400 }
            );
        }

        try {
            await paymentMonitoring.logPaymentEvent({
                userId: payload.data.metadata.userId,
                paymentId: payload.data.reference,
                eventType: 'webhook',
                amount: payload.data.amount / 100,
                metadata: payload.data.metadata
            });
        } catch (logError) {
            console.error('Error logging payment event:', logError);
            // Continue processing - we don't want to fail the webhook just because logging failed
        }

        return safeNextResponseJson({ status: 'success' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return safeNextResponseJson(
            { error: 'Failed to process webhook event' },
            { status: 500 }
        );
    }
}
