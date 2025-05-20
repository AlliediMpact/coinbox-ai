/**
 * Browser-compatible version of Firebase Admin
 * 
 * This is a stub implementation for client-side code that attempts to import the
 * firebase-admin module. In a browser environment, we provide mock implementations
 * that prevent runtime errors when Firebase Admin code paths are encountered.
 */

// Mock Firestore document and collection references
const createMockDocRef = () => ({
  id: 'mock-doc-id',
  set: async () => console.log('Browser mock: Document set operation'),
  update: async () => console.log('Browser mock: Document update operation'),
  get: async () => ({
    exists: false,
    data: () => null,
    id: 'mock-doc-id'
  }),
  onSnapshot: (callback: Function) => {
    console.log('Browser mock: Document onSnapshot operation');
    // Call once with empty data and return unsubscribe function
    setTimeout(() => callback({ exists: false, data: () => null }), 0);
    return () => console.log('Browser mock: Unsubscribe from document');
  }
});

const createMockCollectionRef = () => ({
  doc: (id: string) => createMockDocRef(),
  add: async () => createMockDocRef(),
  where: () => createMockCollectionRef(),
  orderBy: () => createMockCollectionRef(),
  limit: () => createMockCollectionRef(),
  get: async () => ({
    docs: [],
    empty: true,
    forEach: () => {},
    size: 0
  }),
  onSnapshot: (callback: Function) => {
    console.log('Browser mock: Collection onSnapshot operation');
    // Call once with empty data and return unsubscribe function
    setTimeout(() => callback({ docs: [], empty: true }), 0);
    return () => console.log('Browser mock: Unsubscribe from collection');
  }
});

// Export mock implementations for browser environments
export const adminAuth = {
  verifyIdToken: async () => ({ uid: 'mock-uid', email: 'mock@example.com' }),
  getUser: async () => ({ uid: 'mock-uid', email: 'mock@example.com' }),
  createUser: async () => ({ uid: 'mock-uid' }),
  updateUser: async () => ({ uid: 'mock-uid' }),
  setCustomUserClaims: async () => {}
};

export const adminDb = {
  collection: (path: string) => createMockCollectionRef(),
  doc: (path: string) => createMockDocRef(),
  runTransaction: async (callback: Function) => await callback({ get: async () => ({ exists: false, data: () => null }) }),
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => {}
  })
};

export const adminStorage = {
  bucket: () => ({
    file: () => ({
      getSignedUrl: async () => ['https://mock-url.example.com'],
      save: async () => {},
      delete: async () => {}
    }),
    upload: async () => [{ name: 'mock-file' }]
  })
};

// Mock Firestore FieldValue functionality for browser
export const FieldValue = {
  serverTimestamp: () => new Date(),
  increment: (n: number) => n,
  arrayUnion: (...elements: any[]) => elements,
  arrayRemove: (...elements: any[]) => []
};

// Mock Firestore Timestamp functionality for browser
export const Timestamp = {
  now: () => ({ toDate: () => new Date() }),
  fromDate: (date: Date) => ({ toDate: () => date }),
  fromMillis: (millis: number) => ({ toDate: () => new Date(millis) })
};

// Alert developers that they're using browser stubs
console.warn('Using firebase-admin browser stubs. Server-side admin functionality will not work in the browser environment.');

// Mock admin functions for browser
export const verifyIdToken = async () => {
  console.warn('Firebase Admin verifyIdToken called in browser environment');
  return null;
};

export const getUser = async () => {
  console.warn('Firebase Admin getUser called in browser environment');
  return null;
};

export const createUser = async () => {
  console.warn('Firebase Admin createUser called in browser environment');
  return null;
};

export const customAuthClaims = {
  setAdmin: async () => {
    console.warn('Firebase Admin setAdmin called in browser environment');
    return null;
  },
  setModerator: async () => {
    console.warn('Firebase Admin setModerator called in browser environment');
    return null;
  },
  removeClaims: async () => {
    console.warn('Firebase Admin removeClaims called in browser environment');
    return null;
  }
};

// Provide a way to check if we're in browser environment
export const isAdminInitialized = false;
