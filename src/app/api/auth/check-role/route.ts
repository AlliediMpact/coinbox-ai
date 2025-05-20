import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';

// Helper function to get a user's role
export async function getUserRole(userId: string): Promise<string | null> {
    try {
        // Check custom claims first
        if (adminAuth) {
            const user = await adminAuth.getUser(userId);
            if (user.customClaims && user.customClaims.role) {
                return user.customClaims.role;
            }
        }
        
        // Fallback to Firestore role field
        if (adminDb) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();
            if (userData?.role) {
                return userData.role;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized: No session found' }, { status: 401 });
        }

        const userId = session.user.id;
        const role = await getUserRole(userId);
        
        return NextResponse.json({ 
            role: role || 'user',
            permissions: {
                canModifyUsers: role === 'admin',
                canViewAdminPanel: role === 'admin' || role === 'support',
                isReadOnly: role === 'support'
            }
        });
    } catch (error: any) {
        console.error('Error checking user role:', error);
        return NextResponse.json({ error: 'Failed to check role' }, { status: 500 });
    }
}
