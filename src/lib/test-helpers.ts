export async function setupTestData(userId: string) {
  // Lazily import Firestore helpers so Vitest setup files have a chance
  // to initialize a default Firebase app before modules import getFirestore.
  const firestore = await import('firebase/firestore');
  const { getFirestore, doc, setDoc, collection } = firestore;

  let db: any;
  try {
    db = getFirestore();
  } catch (e: any) {
    // If no default app exists, initialize a minimal test app then retry
    if (e && (e.code === 'app/no-app' || /No Firebase App/.test(String(e.message || '')))) {
      try {
        const firebaseAppModule = await import('firebase/app');
        const maybeInit = (firebaseAppModule as any).initializeApp || (firebaseAppModule as any).default?.initializeApp;
        const maybeGetApps = (firebaseAppModule as any).getApps || (firebaseAppModule as any).default?.getApps;
        if (typeof maybeGetApps === 'function' && typeof maybeInit === 'function') {
          if (maybeGetApps().length === 0) {
            maybeInit({
              apiKey: 'test-api-key',
              authDomain: 'localhost',
              projectId: 'test-project',
              appId: '1:123:web:test'
            });
          }
        }
      } catch (ie) {
        // ignore - best-effort initialization for tests
      }

      // Retry getting firestore
      db = getFirestore();
    } else {
      throw e;
    }
  }

  // Setup test wallet
  await setDoc(doc(db, 'wallets', userId), {
    balance: 1000,
    lockedBalance: 0,
    lastUpdated: new Date().toISOString()
  });

  // Setup test transactions
  const transactionsRef = collection(db, 'wallets', userId, 'transactions');
  await setDoc(doc(transactionsRef, 'test1'), {
    type: 'Deposit',
    amount: 500,
    date: new Date().toISOString(),
    method: 'Test',
    status: 'completed'
  });

  // Setup test trading ticket
  await setDoc(doc(db, 'tickets', 'test1'), {
    userId,
    type: 'Borrow',
    amount: 100,
    status: 'Open',
    createdAt: new Date()
  });
}
