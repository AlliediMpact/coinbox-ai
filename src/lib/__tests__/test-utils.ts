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

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(() => ({
    doc: jest.fn(),
    add: jest.fn(),
    where: jest.fn(),
  })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

// Helper function to create a test PaystackService instance
export function createTestPaystackService(): PaystackService {
  const app = initializeApp({});
  const db = getFirestore(app);
  const auth = getAuth(app);
  return new PaystackService();
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
