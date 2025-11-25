import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Get all users with a specific role
 * @param role - The role to filter users by (e.g., 'admin', 'support', 'user')
 * @returns Array of user documents with the specified role
 */
export async function getUsersWithRole(role: string) {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching users with role ${role}:`, error);
    return [];
  }
}

/**
 * Check if a user has a specific role
 * @param userId - The user ID to check
 * @param role - The role to check for
 * @returns Boolean indicating if the user has the specified role
 */
export async function userHasRole(userId: string, role: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    
    if (userDoc.empty) return false;
    
    const userData = userDoc.docs[0].data();
    return userData.role === role;
  } catch (error) {
    console.error(`Error checking role for user ${userId}:`, error);
    return false;
  }
}
