import admin from "firebase-admin";
import { getApps } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL: string;
}

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

function getAdminConfig(): FirebaseAdminConfig {
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  const privateKeyPath = process.env.FIREBASE_PRIVATE_KEY_PATH;

  // Handle private key formatting (newlines)
  if (privateKey) {
    // If the key is base64 encoded (common in some CI environments), decode it
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        try {
            const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
            if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
                privateKey = decoded;
            }
        } catch (e) {
            // Not base64, continue
        }
    }
    
    // Handle escaped newlines which often happen in env vars
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // If direct private key is not available, try to load from file path
  if (!privateKey && privateKeyPath) {
    try {
      // Check if the path is absolute or relative
      const keyPath = path.isAbsolute(privateKeyPath) 
        ? privateKeyPath 
        : path.join(process.cwd(), privateKeyPath);
      
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        privateKey = serviceAccount.private_key;
        // If project ID or client email are missing, get them from file too
        if (!projectId) projectId = serviceAccount.project_id;
        if (!clientEmail) clientEmail = serviceAccount.client_email;
      }
    } catch (error) {
      console.warn('Could not load Firebase private key from file:', error);
    }
  }

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    // During build time or if env vars are missing, we shouldn't crash immediately
    // This allows the build to proceed even without secrets
    console.warn('⚠️ Firebase Admin configuration incomplete. Running in limited mode (UI only).');
    console.warn('   To enable backend features, configure Firebase credentials in .env.local');
    return {
      projectId: projectId || 'dummy',
      clientEmail: clientEmail || 'dummy',
      privateKey: privateKey || 'dummy',
      databaseURL: databaseURL || 'dummy'
    };
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey || '',
    databaseURL
  };
}

// This ensures the code only runs on the server
if (typeof window === 'undefined') {
  if (!getApps().length) {
    try {
      const config = getAdminConfig();
      // Only initialize if we have a real key (not dummy from above fallback)
      if (config.privateKey !== 'dummy' && config.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey: config.privateKey,
          }),
          databaseURL: config.databaseURL,
        });
        console.log("✅ Firebase Admin SDK initialized successfully.");
      } else {
        console.warn('⚠️ Firebase Admin SDK not initialized - missing valid credentials.');
        console.warn('   App will run in UI-only mode. Backend features require proper Firebase setup.');
      }
    } catch (error) {
      console.error("❌ Firebase Admin SDK initialization error:", error);
      console.warn('   Continuing without Firebase Admin - UI will load but backend features disabled.');
      // Do not throw here, so build can succeed
    }
  }

  if (admin.apps.length) {
    const app = admin.app();
    adminAuth = admin.auth(app);
    adminDb = admin.firestore(app);
  } else {
    console.warn('⚠️ Firebase Admin not available - backend API calls will fail gracefully');
  }
}

export { adminAuth, adminDb };