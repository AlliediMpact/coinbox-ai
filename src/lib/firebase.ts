// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase only if config is valid
let app: any = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;

try {
  // Check if we have the minimum required config
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    
    // Initialize auth immediately (not waiting for window)
    authInstance = getAuth(app);
    console.log('[Firebase] Initialized successfully');
  } else {
    console.error('[Firebase] Missing required config:', {
      apiKey: firebaseConfig.apiKey ? 'set' : 'MISSING',
      authDomain: firebaseConfig.authDomain ? 'set' : 'MISSING',
      projectId: firebaseConfig.projectId ? 'set' : 'MISSING',
    });
  }
} catch (error) {
  console.error('[Firebase] Initialization failed:', error);
}

export { app };
export const db = dbInstance as any;
export const auth = authInstance as any;
