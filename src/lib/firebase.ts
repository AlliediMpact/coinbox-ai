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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// In test or misconfigured environments, Firebase Auth can throw.
// Guard initialization to avoid crashing security/test suites.
let authInstance: ReturnType<typeof getAuth> | null = null;

// Initialize auth on client-side only
if (typeof window !== 'undefined') {
  try {
    // Only initialize auth when required env vars exist
    if (
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId
    ) {
      authInstance = getAuth(app);
      console.log('[Firebase] Auth initialized successfully');
      console.log('[Firebase] Config check:', {
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId,
        projectId: firebaseConfig.projectId
      });
    } else {
      console.error('[Firebase] Missing required environment variables');
      console.error('[Firebase] Config:', {
        apiKey: firebaseConfig.apiKey ? 'set' : 'MISSING',
        authDomain: firebaseConfig.authDomain ? 'set' : 'MISSING',
        projectId: firebaseConfig.projectId ? 'set' : 'MISSING',
      });
    }
  } catch (error) {
    console.error('[Firebase] Auth initialization failed:', error);
    authInstance = null;
  }
}

export const auth = authInstance as any;
