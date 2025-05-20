import { adminDb, adminAuth } from '@/lib/firebase-admin';

/**
 * Checks if a user has admin or support level access.
 * Looks for 'role' in custom claims first, then falls back to Firestore 'users' document.
 * @param userId The ID of the user to check.
 * @param requireFullAccess If true, only 'admin' role grants access. If false (default), 'admin' or 'support' grants access.
 * @returns Promise<boolean> True if the user has the required access, false otherwise.
 */
export async function hasAdminAccess(userId: string, requireFullAccess: boolean = false): Promise<boolean> {
    if (!userId) {
        return false; // Early return if no userId provided
    }

    try {
        if (adminAuth) {
            try {
                const user = await adminAuth.getUser(userId);
                if (user?.customClaims?.role) {
                    if (user.customClaims.role === 'admin') {
                        return true;
                    }
                    if (user.customClaims.role === 'support' && !requireFullAccess) {
                        return true;
                    }
                }
            } catch (authError: any) {
                // Only log non-user-not-found errors, as user-not-found is expected in some cases
                if (authError.code !== 'auth/user-not-found') {
                    console.warn(`Auth error in hasAdminAccess for user ${userId}: ${authError.message}`);
                }
            }
        } else {
            console.warn('Firebase Admin Auth SDK not initialized. Cannot check custom claims for hasAdminAccess.');
        }

        // Check Firestore for role regardless of Auth result
        if (adminDb) {
            try {
                const usersCollection = adminDb.collection('users');
                if (!usersCollection) {
                    console.warn(`Users collection not available in hasAdminAccess for user ${userId}`);
                    return false;
                }
                const userDocRef = usersCollection.doc(userId);
                if (!userDocRef) {
                    console.warn(`User doc reference not available in hasAdminAccess for user ${userId}`);
                    return false;
                }
                const userDoc = await userDocRef.get();
                if (userDoc?.exists) {
                    const userData = userDoc.data();
                    if (userData?.role === 'admin') {
                        return true;
                    }
                    if (userData?.role === 'support' && !requireFullAccess) {
                        return true;
                    }
                }
            } catch (firestoreError: any) {
                console.error(`Firestore error in hasAdminAccess for user ${userId}: ${firestoreError.message}`);
            }
        } else {
            console.warn('Admin DB not initialized, cannot check Firestore role for hasAdminAccess.');
        }
        
        return false;
    } catch (error: any) {
        // Final catch block for any other errors
        console.error(`Unexpected error in hasAdminAccess for user ${userId}:`, error.message || error);
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
    if (!userId) {
        return 'user'; // Early return default role if no userId provided
    }

    // Try Auth first
    if (adminAuth) {
        try {
            const user = await adminAuth.getUser(userId);
            if (user?.customClaims?.role) {
                return user.customClaims.role;
            }
        } catch (error: any) {
            // Only log non-user-not-found errors
            if (error.code !== 'auth/user-not-found') {
                console.warn(`Error fetching user from adminAuth in getUserRole for ${userId}: ${error.message}`);
            }
            // Continue to Firestore check for all error types
        }
    }

    // Try Firestore as fallback
    if (adminDb) {
        try {
            const usersCollection = adminDb.collection('users');
            if (!usersCollection) {
                console.warn(`Users collection not available in getUserRole for user ${userId}`);
                return 'user';
            }
            const userDocRef = usersCollection.doc(userId);
            if (!userDocRef) {
                console.warn(`User doc reference not available in getUserRole for user ${userId}`);
                return 'user';
            }
            const userDoc = await userDocRef.get();
            if (userDoc?.exists) {
                const userData = userDoc.data();
                if (userData?.role) {
                    return userData.role;
                }
            }
        } catch (error: any) {
            console.error(`Error fetching user role from Firestore for ${userId}: ${error.message || error}`);
        }
    }
    
    return 'user'; // Default role
}
