import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { validatePaystackWebhook } from '@/lib/webhook-validator';

// Helper function to check admin status
async function isAdmin(userId: string) {
    if (!adminDb) return false;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
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
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get metrics
        const metrics = await paymentMonitoring.getPaymentMetrics(userId || undefined);

        // Get detailed analytics if requested
        let analytics = null;
        if (type !== 'metrics') {
            const analyticsQuery = adminDb?.collection('payment_analytics')
                .orderBy('timestamp', 'desc')
                .limit(100);

            if (userId) {
                analyticsQuery?.where('userId', '==', userId);
            }

            const analyticsSnapshot = await analyticsQuery?.get();
            analytics = analyticsSnapshot?.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return NextResponse.json({
            metrics,
            analytics: type !== 'metrics' ? analytics : undefined
        });
    } catch (error) {
        console.error('Payment analytics error:', error);
        return NextResponse.json(
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
        const payload = JSON.parse(body);

        // Validate webhook signature
        if (!validatePaystackWebhook(request, body)) {
            console.error('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        
        await paymentMonitoring.logPaymentEvent({
            userId: payload.data.metadata.userId,
            paymentId: payload.data.reference,
            eventType: 'webhook',
            amount: payload.data.amount / 100,
            metadata: payload.data.metadata
        });

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook event' },
            { status: 500 }
        );
    }
}
