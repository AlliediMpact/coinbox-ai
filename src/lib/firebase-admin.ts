import admin from "firebase-admin";

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

// This ensures the code only runs on the server
if (typeof window === 'undefined') {
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

  if (admin.apps.length) {
    adminAuth = admin.auth();
    adminDb = admin.firestore();
  }
}

export { adminAuth, adminDb };