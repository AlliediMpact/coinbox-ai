// Mock necessary browser APIs
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.crypto = require('crypto').webcrypto;

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  OPEN: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1
}));

// Mock fetch API
const fetch = require('node-fetch');
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// Import testing library
require('@testing-library/jest-dom');

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    pathname: '',
    query: {},
    asPath: ''
  }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  usePathname: jest.fn().mockReturnValue('')
}));

// Mock next/server NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => {
        const response = new Response(JSON.stringify(body), {
          ...init,
          headers: {
            ...init?.headers,
            'content-type': 'application/json',
          }
        });
        
        Object.defineProperty(response, 'status', {
          get() { return init?.status || 200; }
        });
        
        return response;
      })
    }
  };
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn().mockReturnValue({
    currentUser: { uid: 'test-user-id', email: 'test@example.com' },
    onAuthStateChanged: jest.fn()
  }),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb({ uid: 'test-user-id', email: 'test@example.com' });
    return jest.fn();
  }),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({}),
  signOut: jest.fn().mockResolvedValue({})
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockImplementation(() => ({
    collection: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ 
        balance: 1000, 
        lockedBalance: 200,
        timestamp: new Date() 
      })
    })
  })),
  onSnapshot: jest.fn((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        balance: 1000,
        lockedBalance: 200,
        timestamp: new Date()
      })
    });
    return jest.fn();
  }),
  query: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  startAfter: jest.fn().mockReturnThis(),
  getDocs: jest.fn().mockResolvedValue({
    docs: [
      {
        id: 'mock-doc-1',
        data: () => ({
          type: 'Deposit',
          amount: 500,
          date: new Date().toISOString(),
          method: 'Paystack',
          status: 'completed'
        })
      }
    ],
    forEach: jest.fn(),
    empty: false,
    size: 1
  }),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ 
      balance: 1000, 
      lockedBalance: 200,
      timestamp: new Date() 
    })
  }),
  addDoc: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  setDoc: jest.fn().mockResolvedValue({}),
  updateDoc: jest.fn().mockResolvedValue({}),
  deleteDoc: jest.fn().mockResolvedValue({}),
  serverTimestamp: jest.fn().mockReturnValue(new Date())
}));

// Mock Firebase Admin
const mockAdminFirestore = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          role: 'admin',
          timestamp: new Date()
        })
      }),
      set: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({})
    }),
    add: jest.fn().mockResolvedValue({ id: 'mock-admin-doc-id' }),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [{
        id: 'mock-admin-doc-1',
        data: () => ({
          userId: 'test-user-id',
          amount: 1000,
          status: 'success'
        })
      }],
      forEach: jest.fn()
    }),
    onSnapshot: jest.fn((callback) => {
      callback({
        docChanges: () => [{
          type: 'added',
          doc: {
            id: 'mock-doc-1',
            data: () => ({
              userId: 'test-user-id',
              amount: 1000,
              status: 'success'
            })
          }
        }]
      });
      return jest.fn();
    })
  })
};

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: mockAdminFirestore
}));

// Mock WebSocketServer
jest.mock('ws', () => {
  const MockWebSocket = jest.fn().mockImplementation(() => ({
    readyState: 1, // WebSocket.OPEN
    send: jest.fn(),
    close: jest.fn()
  }));
  
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSED = 3;
  
  return {
    WebSocket: MockWebSocket,
    WebSocketServer: jest.fn().mockImplementation(() => ({
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          callback(new MockWebSocket());
        }
      }),
      clients: new Set([new MockWebSocket()]),
      close: jest.fn()
    }))
  };
});

// Mock next-auth
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin'
  }
};

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue(mockSession)
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: mockSession,
    status: 'authenticated',
    update: jest.fn()
  })),
  signIn: jest.fn().mockResolvedValue({ ok: true }),
  signOut: jest.fn().mockResolvedValue({ ok: true })
}));

// Mock Paystack
jest.mock('@paystack/inline-js', () => {
  return jest.fn().mockImplementation(() => ({
    openIframe: jest.fn(),
    onSuccess: jest.fn(),
    onClose: jest.fn()
  }));
});

// Set environment variables for tests
process.env.PAYSTACK_SECRET_KEY = 'test_sk_123456789';
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'test_pk_123456789';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
