import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { safeNextResponseJson } from '@/app/api-utils';
import { hasAdminAccess, getUserRole } from '@/lib/auth-utils'; // Import utility
import { getServerSession, Session } from 'next-auth';

export async function POST(request: NextRequest) {
    try {
        if (!adminAuth || !adminDb) {
            console.error('Firebase Admin SDK not initialized. adminAuth or adminDb is null.');
            return safeNextResponseJson({ error: 'Server configuration error.' }, { status: 500 });
        }

        const session: Session | null = await getServerSession();
        let currentUserId: string | undefined = undefined;

        if (session?.user && (session.user as any).id) { 
            currentUserId = (session.user as any).id;
        } else if (session?.user && (session.user as any).sub) { 
            currentUserId = (session.user as any).sub;
        }

        if (!currentUserId) {
            return safeNextResponseJson({ error: 'Unauthorized: User not logged in.' }, { status: 401 });
        }

        // Check if the calling user is an admin (requires full access)
        if (!(await hasAdminAccess(currentUserId, true))) {
            return safeNextResponseJson({ error: 'Unauthorized: Caller is not an admin.' }, { status: 403 });
        }

        const body = await request.json();
        const { userIdToSet, roleToSet } = body;

        if (!userIdToSet || !roleToSet) {
            return safeNextResponseJson({ error: 'Missing userIdToSet or roleToSet in request body' }, { status: 400 });
        }

        const validRoles = ['admin', 'support', 'user'];
        if (!validRoles.includes(roleToSet)) {
            return safeNextResponseJson({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
        }

        // Prevent admin from accidentally removing their own admin role via this specific endpoint
        // They should use Firebase console or another dedicated mechanism for such a critical change.
        if (userIdToSet === currentUserId && roleToSet !== 'admin' && (await getUserRole(currentUserId)) === 'admin') {
            return safeNextResponseJson({ error: 'Admins cannot remove their own admin status via this endpoint.' }, { status: 400 });
        }

        // Set custom claims
        await adminAuth.setCustomUserClaims(userIdToSet, { role: roleToSet });

        // Update Firestore document (optional, but good for consistency)
        const userRef = adminDb.collection('users').doc(userIdToSet);
        await userRef.set({ role: roleToSet }, { merge: true });

        // Invalidate user's tokens by updating revokedTimestamp
        // This forces the user to re-login and get new token with updated claims
        // await adminAuth.revokeRefreshTokens(userIdToSet);
        // The above revokes all sessions. A more targeted approach might be needed if there are multiple sessions.
        // Alternatively, can update a 'claimsVersion' or similar in custom claims to signal clients to refresh tokens.
        // For now, we will rely on the client to refresh the ID token upon role change confirmation.

        return safeNextResponseJson({ message: `Role for user ${userIdToSet} successfully set to ${roleToSet}.` });

    } catch (error: any) {
        console.error('Error setting role:', error);
        // Check for specific Firebase Admin SDK errors if necessary
        if (error.code === 'auth/user-not-found') {
            return safeNextResponseJson({ error: `User with ID ${error.uid} not found.` }, { status: 404 });
        }
        return safeNextResponseJson({ error: 'Failed to set role', details: error.message }, { status: 500 });
    }
}
