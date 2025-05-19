import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert(process.env.FIREBASE_PRIVATE_KEY_PATH as string),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid auth token');
  }
}
