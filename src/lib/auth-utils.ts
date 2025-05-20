import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * Checks if a user has admin or support level access.
 * Looks for 'role' in custom claims first, then falls back to Firestore 'users' document.
 * @param userId The ID of the user to check.
 * @param requireFullAccess If true, only 'admin' role grants access. If false (default), 'admin' or 'support' grants access.
 * @returns Promise<boolean> True if the user has the required access, false otherwise.
 */
export async function hasAdminAccess(userId: string, requireFullAccess: boolean = false): Promise<boolean> {
    try {
        if (adminAuth) {
            const user = await adminAuth.getUser(userId);
            if (user.customClaims && user.customClaims.role) {
                if (user.customClaims.role === 'admin') {
                    return true;
                }
                if (user.customClaims.role === 'support' && !requireFullAccess) {
                    return true;
                }
            }
        } else {
            console.warn('Firebase Admin Auth SDK not initialized. Cannot check custom claims for hasAdminAccess.');
        }

        if (adminDb) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData?.role === 'admin') {
                    // Optional: If Firestore role is admin, but no custom claim (and adminAuth is available), consider setting it.
                    // This can help in migrating roles to custom claims.
                    // if (adminAuth && (!user.customClaims || !user.customClaims.role)) {
                    //     await adminAuth.setCustomUserClaims(userId, { role: 'admin' });
                    //     console.log(`Custom claim 'admin' set for user ${userId} based on Firestore role during hasAdminAccess check.`);
                    // }
                    return true;
                }
                if (userData?.role === 'support' && !requireFullAccess) {
                    // if (adminAuth && (!user.customClaims || !user.customClaims.role)) {
                    //     await adminAuth.setCustomUserClaims(userId, { role: 'support' });
                    //     console.log(`Custom claim 'support' set for user ${userId} based on Firestore role during hasAdminAccess check.`);
                    // }
                    return true;
                }
            }
        } else {
            console.warn('Admin DB not initialized, cannot check Firestore role for hasAdminAccess.');
        }
        
        return false;
    } catch (error: any) {
        // Handle cases where the user might not exist in Firebase Auth (e.g., if only in Firestore)
        if (error.code === 'auth/user-not-found' && adminDb) {
            console.warn(`User ${userId} not found in Firebase Auth for hasAdminAccess. Checking Firestore role as fallback.`);
            try {
                const userDoc = await adminDb.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData?.role === 'admin') return true;
                    if (userData?.role === 'support' && !requireFullAccess) return true;
                }
            } catch (firestoreError) {
                console.error('Error checking Firestore role in hasAdminAccess after auth/user-not-found:', firestoreError);
                return false;
            }
        }
        // For other errors, or if user not found in Auth and not in Firestore either
        console.error(`Error in hasAdminAccess for user ${userId}:`, error.message);
        return false;
    }
}

/**
 * Retrieves the user's role.
 * Checks custom claims first, then Firestore. Defaults to 'user'.
 * @param userId The ID of the user.
 * @returns Promise<string> The user's role.
 */
export async function getUserRole(userId: string): Promise<string> {
    try {
        if (adminAuth) {
            const user = await adminAuth.getUser(userId);
            if (user.customClaims && user.customClaims.role) {
                return user.customClaims.role;
            }
        }
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            console.warn(`Error fetching user from adminAuth in getUserRole for ${userId}: ${error.message}. Will check Firestore.`);
        }
        // If user not found in Auth or other error, proceed to check Firestore
    }

    try {
        if (adminDb) {
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData && userData.role) {
                    return userData.role;
                }
            }
        }
    } catch (error: any) {
        console.error(`Error fetching user role from Firestore for ${userId}: ${error.message}`);
    }
    
    return 'user'; // Default role
}
