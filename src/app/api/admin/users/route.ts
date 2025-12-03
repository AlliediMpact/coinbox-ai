import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { safeNextResponseJson } from '@/app/api-utils';
import { hasAdminAccess, getUserRole } from '@/lib/auth-utils'; // Import utilities
import { getServerSession, Session } from 'next-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

        // Only admins can list all users
        if (!(await hasAdminAccess(currentUserId, true))) {
            return safeNextResponseJson({ error: 'Unauthorized: Caller is not an admin.' }, { status: 403 });
        }

        const listUsersResult = await adminAuth.listUsers(1000); // Adjust limit as needed
        const users = await Promise.all(
            listUsersResult.users.map(async (userRecord) => {
                const role = await getUserRole(userRecord.uid); // Use utility to get role
                return {
                    uid: userRecord.uid,
                    email: userRecord.email,
                    displayName: userRecord.displayName,
                    photoURL: userRecord.photoURL,
                    disabled: userRecord.disabled,
                    emailVerified: userRecord.emailVerified,
                    metadata: {
                        creationTime: userRecord.metadata.creationTime,
                        lastSignInTime: userRecord.metadata.lastSignInTime,
                    },
                    customClaims: userRecord.customClaims, // Include existing custom claims
                    role: role, // Add the determined role
                };
            })
        );

        return safeNextResponseJson({ users });

    } catch (error: any) {
        console.error('Error listing users:', error);
        return safeNextResponseJson({ error: 'Failed to list users', details: error.message }, { status: 500 });
    }
}
