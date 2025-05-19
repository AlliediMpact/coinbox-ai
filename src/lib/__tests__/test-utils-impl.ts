import { PaystackService } from '../paystack-service';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Mock environment variables
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'test_public_key';
process.env.PAYSTACK_SECRET_KEY = 'test_secret_key';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:9004';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/firestore', () => {
  const addMock = jest.fn().mockResolvedValue({ id: 'mock-doc-id' });
  const docMock = jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: jest.fn().mockReturnValue({ balance: 100 }),
      id: 'mock-doc-id'
    }),
    set: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true)
  });
  
  const collectionMock = jest.fn().mockReturnValue({
    doc: docMock,
    add: addMock,
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'mock-doc-id',
          data: jest.fn().mockReturnValue({ name: 'Test' }),
          exists: true
        }
      ],
      empty: false
    })
  });

  return {
    getFirestore: jest.fn(),
    collection: collectionMock,
    doc: docMock,
    getDoc: jest.fn().mockResolvedValue({
      exists: jest.fn().mockReturnValue(true),
      data: jest.fn().mockReturnValue({ balance: 100 })
    }),
    setDoc: jest.fn().mockResolvedValue(true),
    updateDoc: jest.fn().mockResolvedValue(true),
    deleteDoc: jest.fn().mockResolvedValue(true),
    onSnapshot: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({
      docs: [
        {
          id: 'mock-doc-id',
          data: jest.fn().mockReturnValue({ name: 'Test' })
        }
      ]
    }),
    docChanges: jest.fn().mockReturnValue([
      {
        type: 'added',
        doc: {
          id: 'change-doc-id',
          data: jest.fn().mockReturnValue({ event: 'payment' })
        }
      }
    ])
  };
});

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

// Helper function to create a test PaystackService instance
export function createTestPaystackService() {
  const app = initializeApp({});
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  // Create a mock PaystackService instance
  return {
    initializePayment: jest.fn().mockResolvedValue({
      status: true,
      message: 'Payment initialized',
      data: {
        authorization_url: 'https://test-checkout.paystack.com/test',
        access_code: 'test_code',
        reference: 'test-reference'
      }
    }),
    verifyPayment: jest.fn().mockResolvedValue({
      status: true,
      message: 'Payment verified',
      data: {
        status: 'success',
        reference: 'test-reference',
        amount: 50000
      }
    }),
    logPaymentFailure: jest.fn(),
    processWebhookEvent: jest.fn()
  };
}

// Helper function to mock successful payment response
export function mockSuccessfulPayment() {
  return {
    status: true,
    message: 'Payment successful',
    data: {
      reference: 'test_ref_123',
      status: 'success',
      amount: 55000, // 550 ZAR in kobo
      customer: {
        email: 'test@example.com'
      },
      metadata: {
        userId: 'test_user_123',
        membershipTier: 'Basic'
      }
    }
  };
}

// Helper function to mock failed payment response
export function mockFailedPayment() {
  return {
    status: false,
    message: 'Payment failed',
    data: {
      reference: 'test_ref_456',
      status: 'failed',
      amount: 55000,
      customer: {
        email: 'test@example.com'
      }
    }
  };
}
