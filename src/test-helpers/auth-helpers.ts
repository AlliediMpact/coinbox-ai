import { Page } from '@playwright/test';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getFirestore } from 'firebase/firestore';
import { app } from '../../config/firebase';

interface MockUserConfig {
  displayName: string;
  email: string;
  password: string;
}

/**
 * Creates a mock user for testing purposes
 */
export async function createMockUser(config: MockUserConfig): Promise<string> {
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      config.email, 
      config.password
    );
    
    // Create a user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      displayName: config.displayName,
      email: config.email,
      createdAt: new Date(),
      role: 'user',
      profileCompleted: true,
    });
    
    return userCredential.user.uid;
  } catch (error) {
    console.error('Error creating mock user:', error);
    throw error;
  }
}

/**
 * Login as mock user in the provided page
 */
export async function loginAsMockUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for navigation to dashboard
  await page.waitForURL(/dashboard/);
}

/**
 * Cleans up test user data
 */
export async function clearMockUserData(userId: string): Promise<void> {
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  try {
    if (auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
    
    // Clean up user document
    await deleteDoc(doc(db, 'users', userId));
    
    // Clean up additional user data as needed
    // e.g., receipts, transactions, etc.
    const collections = ['receipts', 'payments', 'notifications'];
    for (const collection of collections) {
      try {
        await deleteDoc(doc(db, collection, userId));
      } catch (e) {
        // Ignore if document doesn't exist
      }
    }
  } catch (error) {
    console.error('Error cleaning up mock user data:', error);
  }
}
