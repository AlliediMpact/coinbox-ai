import admin from "firebase-admin";
import { getApps } from 'firebase-admin/app';

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL: string;
}

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

function getAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error('Missing Firebase Admin configuration. Please check your environment variables.');
  }

  return {
    projectId,
    clientEmail,
    privateKey,
    databaseURL
  };
}

// This ensures the code only runs on the server
if (typeof window === 'undefined') {
  if (!getApps().length) {
    try {
      const config = getAdminConfig();
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
        databaseURL: config.databaseURL,
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("Firebase Admin SDK initialization error:", error);
      throw error;
    }
  }

  if (admin.apps.length) {
    const app = admin.app();
    adminAuth = admin.auth(app);
    adminDb = admin.firestore(app);
  }
}

export { adminAuth, adminDb };