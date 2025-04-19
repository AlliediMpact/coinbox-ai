// This ensures the code only runs on the server
if (typeof window === 'undefined') {
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }

  export const adminAuth = admin.auth();
  export const adminDb = admin.firestore();
} else {
  export const adminAuth = null;
  export const adminDb = null;
}