import '@testing-library/jest-dom';

// Mock window crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {}
  }
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '',
    query: {},
    asPath: '',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  onSnapshot: jest.fn(() => () => {}),
  query: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getDocs: jest.fn(() => Promise.resolve({ 
    docs: [],
    empty: true,
    size: 0,
    forEach: jest.fn()
  })),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => false,
    data: () => null
  })),
  addDoc: jest.fn(() => Promise.resolve()),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => 'timestamp'),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn()
  })),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(null);
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Paystack
jest.mock('@paystack/inline-js', () => {
  return jest.fn().mockImplementation(() => ({
    openIframe: jest.fn(),
    onSuccess: jest.fn(),
    onClose: jest.fn(),
  }));
});
