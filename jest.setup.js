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

// Mock Firestore operations object
const mockFirestoreOperations = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  onSnapshot: jest.fn(() => () => {}),
  query: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  add: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve({
    exists: true,
    data: () => ({
      id: 'mock-doc-id',
      timestamp: new Date(),
      data: 'mock-data'
    }),
    id: 'mock-doc-id'
  })),
  docChanges: jest.fn(() => [{
    type: 'added',
    doc: {
      id: 'mock-doc-id',
      data: () => ({
        timestamp: new Date(),
        data: 'mock-data'
      })
    }
  }])
};

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  onSnapshot: jest.fn((query, callback) => {
    callback(mockFirestoreOperations);
    return () => {};
  }),
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
    exists: () => true,
    data: () => ({
      id: 'mock-doc-id',
      timestamp: new Date(),
      data: 'mock-data'
    })
  })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => new Date()),
}));

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn(() => mockFirestoreOperations),
    doc: jest.fn(() => mockFirestoreOperations),
    onSnapshot: jest.fn(() => () => {}),
    get: jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({
        id: 'mock-doc-id',
        timestamp: new Date(),
        data: 'mock-data'
      })
    }))
  }
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

// Mock WebSocket and WebSocketServer
jest.mock('ws', () => {
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor() {
      this.readyState = MockWebSocket.OPEN;
      this.send = jest.fn();
      this.close = jest.fn();
      this.onopen = jest.fn();
      this.onclose = jest.fn();
      this.onmessage = jest.fn();
      this.onerror = jest.fn();
    }
  }

  class MockWebSocketServer {
    constructor() {
      this.on = jest.fn();
      this.close = jest.fn();
      this.clients = new Set();
    }
  }

  return {
    WebSocket: MockWebSocket,
    WebSocketServer: MockWebSocketServer
  };
});

// Mock Paystack
jest.mock('@paystack/inline-js', () => {
  return jest.fn().mockImplementation(() => ({
    openIframe: jest.fn(),
    onSuccess: jest.fn(),
    onClose: jest.fn(),
  }));
});

// Mock Paystack configuration
process.env.PAYSTACK_SECRET_KEY = 'test_sk_123';
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'test_pk_123';

// Mock window and other browser APIs
Object.defineProperty(global, 'window', {
  value: {
    fetch: global.fetch,
    TextEncoder: global.TextEncoder,
    TextDecoder: global.TextDecoder,
    crypto: global.crypto,
  }
});

// Mock Next.js Request/Response
import { Request, Response, Headers, fetch } from 'undici';
Object.defineProperty(global, 'Request', { value: Request });
Object.defineProperty(global, 'Response', { value: Response });
Object.defineProperty(global, 'Headers', { value: Headers });
Object.defineProperty(global, 'fetch', { value: fetch });

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: 'mock-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }
  }))
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    },
    status: 'authenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn()
}));
