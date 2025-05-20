import { NextRequest, NextResponse } from 'next/server';
import { paymentMonitoring } from '@/lib/payment-monitoring';
import { adminDb } from '@/lib/firebase-admin'; // adminAuth removed as it's used via auth-utils
import { getServerSession, Session } from 'next-auth'; 
import { safeNextResponseJson } from '@/app/api-utils';
import { hasAdminAccess } from '@/lib/auth-utils'; // Import the new utility function

interface AnalyticsItem {
    id: string;
    [key: string]: any;
}

// Helper function to check if user has admin or support role
// MOVED to /lib/auth-utils.ts
// async function hasAdminAccess(userId: string, requireFullAccess: boolean = false): Promise<boolean> { ... }

export async function GET(request: NextRequest) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const userIdParam = searchParams.get('userId');
        const type = searchParams.get('type') || 'all';

        const session: Session | null = await getServerSession();
        
        let currentUserId: string | undefined = undefined;
        // Use a type assertion for session.user.id if you are sure about its structure
        // For NextAuth.js, the user ID is typically in session.user.id or session.user.sub
        if (session?.user && (session.user as any).id) { 
            currentUserId = (session.user as any).id;
        } else if (session?.user && (session.user as any).sub) { // Fallback for 'sub' claim
            currentUserId = (session.user as any).sub;
        }

        // Authorization check: Only allow admins or support to view other users' data
        if (userIdParam && userIdParam !== currentUserId) {
            if (!currentUserId || !(await hasAdminAccess(currentUserId))) {
                return safeNextResponseJson(
                    { error: 'Unauthorized: Requester does not have sufficient permissions or is not logged in.' },
                    { status: 403 }
                );
            }
        } else if (userIdParam && userIdParam === currentUserId) {
            // User is requesting their own data, allow.
        } else if (!userIdParam) {
            // Requesting all data, requires admin or support role
            if (!currentUserId || !(await hasAdminAccess(currentUserId))) {
                 return safeNextResponseJson(
                    { error: 'Unauthorized: Admin or Support role required to view analytics.' },
                    { status: 403 }
                );
            }
        }

        const metrics = await paymentMonitoring.getPaymentMetrics(userIdParam || undefined);

        let analytics: AnalyticsItem[] = [];
        if (type !== 'metrics') {
            if (!adminDb) {
                console.warn('Admin DB not initialized, cannot fetch detailed analytics.');
            } else {
                try {
                    let analyticsQuery = adminDb.collection('payment_analytics')
                        .orderBy('timestamp', 'desc')
                        .limit(100);

                    if (userIdParam) {
                        analyticsQuery = analyticsQuery.where('userId', '==', userIdParam);
                    }
                    // If no userIdParam, and it passed the admin check, it means we fetch all analytics.

                    const analyticsSnapshot = await analyticsQuery.get();
                    
                    if (analyticsSnapshot && analyticsSnapshot.docs) {
                        analytics = analyticsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                    }
                } catch (analyticsError) {
                    console.error('Error fetching analytics:', analyticsError);
                    // Don't fail the whole request if analytics fail, metrics might still be useful
                }
            }
        }

        return safeNextResponseJson({
            metrics,
            analytics: type !== 'metrics' ? analytics : undefined
        });
    } catch (error) {
        console.error('Payment analytics GET error:', error);
        return safeNextResponseJson(
            { error: 'Failed to fetch payment metrics' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // This is a new POST handler, assuming it's for creating/updating analytics data
    // and should be admin restricted.
    try {
        const session: Session | null = await getServerSession();
        let currentUserId: string | undefined = undefined;

        if (session?.user && (session.user as any).id) { 
            currentUserId = (session.user as any).id;
        } else if (session?.user && (session.user as any).sub) { 
            currentUserId = (session.user as any).sub;
        }

        if (!currentUserId || !(await hasAdminAccess(currentUserId, true))) { // requireFullAccess = true for POST
            return safeNextResponseJson(
                { error: 'Unauthorized: Admin role required to modify analytics data.' },
                { status: 403 }
            );
        }

        // Assuming the body contains analytics data to be processed or stored
        const body = await request.json();

        // TODO: Implement actual logic for handling the POST request, e.g., saving data
        // For now, just a placeholder response
        if (!adminDb) {
            console.error('Admin DB not initialized, cannot process POST request for payment analytics.');
            return safeNextResponseJson(
                { error: 'Server configuration error.' },
                { status: 500 }
            );
        }
        // Example: Storing some data
        // const docRef = await adminDb.collection('payment_analytics_updates').add({
        //     receivedData: body,
        //     processedAt: new Date(),
        //     adminUserId: currentUserId
        // });

        return safeNextResponseJson({ message: 'Analytics data received (placeholder)', data: body }, { status: 200 });

    } catch (error) {
        console.error('Payment analytics POST error:', error);
        return safeNextResponseJson(
            { error: 'Failed to process payment analytics POST request' },
            { status: 500 }
        );
    }
}

// Potentially a PUT handler for updates, also admin restricted
export async function PUT(request: NextRequest) {
    try {
        const session: Session | null = await getServerSession();
        let currentUserId: string | undefined = undefined;

        if (session?.user && (session.user as any).id) { 
            currentUserId = (session.user as any).id;
        } else if (session?.user && (session.user as any).sub) { 
            currentUserId = (session.user as any).sub;
        }

        if (!currentUserId || !(await hasAdminAccess(currentUserId, true))) { // requireFullAccess = true for PUT
            return safeNextResponseJson(
                { error: 'Unauthorized: Admin role required to update analytics data.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        // TODO: Implement update logic
        return safeNextResponseJson({ message: 'Analytics data update received (placeholder)', data: body }, { status: 200 });

    } catch (error) {
        console.error('Payment analytics PUT error:', error);
        return safeNextResponseJson(
            { error: 'Failed to process payment analytics PUT request' },
            { status: 500 }
        );
    }
}

// Potentially a DELETE handler, also admin restricted
export async function DELETE(request: NextRequest) {
    try {
        const session: Session | null = await getServerSession();
        let currentUserId: string | undefined = undefined;

        if (session?.user && (session.user as any).id) { 
            currentUserId = (session.user as any).id;
        } else if (session?.user && (session.user as any).sub) { 
            currentUserId = (session.user as any).sub;
        }

        if (!currentUserId || !(await hasAdminAccess(currentUserId, true))) { // requireFullAccess = true for DELETE
            return safeNextResponseJson(
                { error: 'Unauthorized: Admin role required to delete analytics data.' },
                { status: 403 }
            );
        }
        
        const searchParams = new URL(request.url).searchParams;
        const recordId = searchParams.get('recordId');

        if (!recordId) {
            return safeNextResponseJson(
                { error: 'Missing recordId parameter for DELETE operation.' },
                { status: 400 }
            );
        }
        
        // TODO: Implement delete logic, e.g., deleting a specific analytics record
        // if (adminDb) {
        //     await adminDb.collection('payment_analytics').doc(recordId).delete();
        // }

        return safeNextResponseJson({ message: `Analytics record ${recordId} deletion processed (placeholder)` }, { status: 200 });

    } catch (error) {
        console.error('Payment analytics DELETE error:', error);
        return safeNextResponseJson(
            { error: 'Failed to process payment analytics DELETE request' },
            { status: 500 }
        );
    }
}
