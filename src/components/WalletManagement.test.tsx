import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WalletManagement from './WalletManagement'
import { useAuth } from '@/components/AuthProvider'
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore methods
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  onSnapshot: jest.fn().mockImplementation((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        balance: 1000,
        lockedBalance: 200
      })
    });
    return jest.fn();
  }),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({
    docs: [
      {
        id: 'txn1',
        data: () => ({
          type: 'Deposit',
          amount: 500,
          date: new Date().toISOString(),
          method: 'Paystack',
          status: 'completed'
        })
      }
    ]
  }),
  addDoc: jest.fn().mockResolvedValue({ id: 'mock-txn-id' })
}));

// Mock AuthProvider
jest.mock('@/components/AuthProvider', () => ({
  useAuth: jest.fn()
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock paystack-service
jest.mock('@/lib/paystack-service', () => ({
  paystackService: {
    initializePayment: jest.fn().mockResolvedValue({
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.com/123456'
      }
    })
  }
}));

describe('WalletManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock auth
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: 'test-user-id', email: 'test@example.com' }
    });
  })

  it('renders wallet balances', async () => {
    render(<WalletManagement />)
    
    await waitFor(() => {
      expect(screen.getByText(/Available Balance/i)).toBeInTheDocument()
      expect(screen.getByText(/Locked Balance/i)).toBeInTheDocument()
    })
  })

  it('opens deposit dialog', async () => {
    render(<WalletManagement />)
    
    // Wait for balance to be rendered first
    await waitFor(() => {
      expect(screen.getByText(/Available Balance/i)).toBeInTheDocument()
    })
    
    // Find and click the deposit button
    const depositButton = screen.getByText(/Deposit \/ Withdraw/i);
    fireEvent.click(depositButton);
    
    // Check if dialog opens
    await waitFor(() => {
      expect(screen.getByText(/Select a payment method/i)).toBeInTheDocument()
    })
  })
})
