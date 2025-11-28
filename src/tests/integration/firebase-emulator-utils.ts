/**
 * Firebase Emulator Integration Test Utilities
 * Provides setup, teardown, and helper functions for Firebase Emulator tests
 */

import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  query,
  Timestamp
} from 'firebase/firestore';
import { initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

export const EMULATOR_CONFIG = {
  projectId: 'test-project',
  host: '127.0.0.1',
  firestorePort: 8080,
};

let testApp: FirebaseApp | null = null;
let testDb: Firestore | null = null;
let adminApp: any = null;
let adminDb: any = null;

/**
 * Initialize Firebase app connected to the emulator
 */
export function initializeTestApp(): { app: FirebaseApp; db: Firestore } {
  if (testApp && testDb) {
    return { app: testApp, db: testDb };
  }

  // Clean up existing apps
  getApps().forEach(app => deleteApp(app));

  testApp = initializeApp({
    projectId: EMULATOR_CONFIG.projectId,
    apiKey: 'fake-api-key',
    authDomain: 'localhost',
    storageBucket: 'test-bucket',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  });

  testDb = getFirestore(testApp);
  
  // Connect to Firestore emulator
  connectFirestoreEmulator(testDb, EMULATOR_CONFIG.host, EMULATOR_CONFIG.firestorePort);

  return { app: testApp, db: testDb };
}

/**
 * Initialize Admin SDK connected to emulator
 */
export function initializeAdminTestApp() {
  if (adminApp && adminDb) {
    return { app: adminApp, db: adminDb };
  }

  adminApp = initializeAdminApp({
    projectId: EMULATOR_CONFIG.projectId,
  });

  adminDb = getAdminFirestore(adminApp);
  adminDb.settings({
    host: `${EMULATOR_CONFIG.host}:${EMULATOR_CONFIG.firestorePort}`,
    ssl: false,
  });

  return { app: adminApp, db: adminDb };
}

/**
 * Clear all data from Firestore emulator for a clean test state
 */
export async function clearFirestoreData(db: Firestore): Promise<void> {
  const collections = [
    'users',
    'tickets',
    'transactions',
    'payments',
    'disputes',
    'notifications',
    'rateLimits',
    'tradingRateLimits',
    'flaggedAccounts',
    'securityEvents',
    'audit_logs',
  ];

  for (const collectionName of collections) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    const deletePromises = snapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, collectionName, docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
  }
}

/**
 * Cleanup test environment
 */
export async function cleanupTestEnvironment(): Promise<void> {
  if (testDb) {
    await clearFirestoreData(testDb);
  }

  if (testApp) {
    await deleteApp(testApp);
    testApp = null;
    testDb = null;
  }

  if (adminApp) {
    await adminApp.delete();
    adminApp = null;
    adminDb = null;
  }
}

/**
 * Helper to create test data in Firestore
 */
export async function createTestDocument(
  db: Firestore,
  collectionName: string,
  docId: string,
  data: any
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
  });
}

/**
 * Helper to verify document exists
 */
export async function documentExists(
  db: Firestore,
  collectionName: string,
  docId: string
): Promise<boolean> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

/**
 * Helper to get document data
 */
export async function getDocumentData(
  db: Firestore,
  collectionName: string,
  docId: string
): Promise<any | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

/**
 * Wait for a condition to be true (useful for real-time listener tests)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Export helpers for external use
 */
export { collection, doc, setDoc, getDoc, deleteDoc, getDocs, query, Timestamp };
