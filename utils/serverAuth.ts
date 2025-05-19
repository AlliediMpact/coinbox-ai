import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // First, try to load from FIREBASE_PRIVATE_KEY_PATH
    const privateKeyPath = process.env.FIREBASE_PRIVATE_KEY_PATH;
    
    if (privateKeyPath) {
      // Check if the path is absolute or relative
      const keyPath = path.isAbsolute(privateKeyPath)
        ? privateKeyPath
        : path.join(process.cwd(), privateKeyPath);
        
      if (fs.existsSync(keyPath)) {
        // Initialize with service account file
        initializeApp({
          credential: cert(keyPath),
          databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
        console.log('Firebase Admin initialized with service account file');
      } else {
        throw new Error(`Firebase service account file not found: ${keyPath}`);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      // Initialize with environment variables
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log('Firebase Admin initialized with environment variables');
    } else {
      throw new Error('Firebase Admin initialization failed: Missing required configuration');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Don't re-throw the error here, as it would prevent the application from starting
  }
}

/**
 * Verify a Firebase Auth ID token
 * @param token Firebase Auth ID token
 * @returns Decoded token with user claims
 */
export async function verifyAuthToken(token: string) {
  try {
    // Verify the ID token
    const decodedToken = await auth().verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    console.error('Auth token verification error:', error.message);
    throw new Error('Invalid auth token');
  }
}

/**
 * Get a user by ID from Firebase Auth
 * @param uid User ID
 * @returns Firebase user record
 */
export async function getUserById(uid: string) {
  try {
    return await auth().getUser(uid);
  } catch (error: any) {
    console.error(`Error getting user ${uid}:`, error.message);
    throw error;
  }
}

/**
 * Create a session cookie for authenticated users
 * @param idToken Firebase Auth ID token
 * @param expiresIn Cookie expiration in milliseconds
 * @returns Session cookie string
 */
export async function createSessionCookie(idToken: string, expiresIn = 7 * 24 * 60 * 60 * 1000) {
  try {
    return await auth().createSessionCookie(idToken, { expiresIn });
  } catch (error: any) {
    console.error('Error creating session cookie:', error.message);
    throw error;
  }
}
