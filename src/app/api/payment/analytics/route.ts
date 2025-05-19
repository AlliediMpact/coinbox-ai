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
        // Get user session
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = new URL(request.url).searchParams;
        const userId = searchParams.get('userId');
        const type = searchParams.get('type') || 'all';

        // Check permissions
        if (userId && userId !== session.user.id) {
            const isAdminUser = await isAdmin(session.user.id);
            if (!isAdminUser) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
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
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
