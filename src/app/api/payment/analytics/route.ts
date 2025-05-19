import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';

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
        const payload = await request.json();
        
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
