import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WalletManagement from './WalletManagement'
import { useAuth } from '@/components/AuthProvider'
import * as firestore from 'firebase/firestore';
import { vi, Mock } from 'vitest';

// Mock Firebase Firestore methods
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn().mockImplementation((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        balance: 1000,
        lockedBalance: 200
      })
    });
    return vi.fn();
  }),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
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
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-txn-id' })
}));

// Mock AuthProvider
vi.mock('@/components/AuthProvider', () => ({
  useAuth: vi.fn()
}));

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock paystack-service
vi.mock('@/lib/paystack-service', () => ({
  paystackService: {
    initializePayment: vi.fn().mockResolvedValue({
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.com/123456'
      }
    })
  }
}));

describe('WalletManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock auth
    (useAuth as Mock).mockReturnValue({
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
