import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiptManager from '@/components/payments/ReceiptManager';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import EnhancedDisputeManagement from '@/components/disputes/EnhancedDisputeManagement';
import { User } from 'firebase/auth';
import { AuthContext } from '@/components/AuthProvider';
import { vi, Mock } from 'vitest';

// Mock Firebase to prevent initialization errors
vi.mock('@/lib/firebase', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
  functions: {}
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  FacebookAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  getIdToken: async () => 'test-token',
} as User;

const authContextValue = {
  user: mockUser,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  sendPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  updateUserProfile: vi.fn(),
  resendVerificationEmail: vi.fn(),
  checkEmailVerification: vi.fn(),
  enrollMfa: vi.fn(),
  verifyMfaCode: vi.fn(),
  isMfaEnabled: vi.fn(),
  getMfaPhone: vi.fn(),
  disableMfa: vi.fn(),
  userClaims: null,
};

const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={authContextValue}>
      {ui}
    </AuthContext.Provider>
  );
};

// Mock dependencies
vi.mock('@/lib/receipt-service', () => ({
  receiptService: {
    listUserReceipts: vi.fn().mockResolvedValue([]),
    generateReceipt: vi.fn().mockResolvedValue({ id: 'test-receipt' }),
  }
}));

vi.mock('@/lib/analytics-service', () => ({
  analyticsService: {
    getTransactionAnalytics: vi.fn().mockResolvedValue({ data: [] }),
    getUserAnalytics: vi.fn().mockResolvedValue({ data: [] }),
    getSystemPerformanceMetrics: vi.fn().mockResolvedValue({ data: [] }),
    getPlatformMetrics: vi.fn().mockResolvedValue({ data: [] }),
  }
}));

vi.mock('@/lib/dispute-resolution-service', () => ({
  disputeResolutionService: {
    getUserDisputes: vi.fn().mockResolvedValue([]),
    getDisputeDetails: vi.fn().mockResolvedValue(null),
  }
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Component Integration Tests', () => {
  test('ReceiptManager renders without errors', () => {
    renderWithAuth(<ReceiptManager />);
    expect(screen.getByTestId('receipt-manager-title')).toBeInTheDocument();
  });

  test('AnalyticsDashboard renders without errors', () => {
    renderWithAuth(<AnalyticsDashboard />);
    expect(screen.getByRole('heading', { name: /analytics dashboard/i })).toBeInTheDocument();
  });

  test('EnhancedDisputeManagement renders without errors', () => {
    renderWithAuth(<EnhancedDisputeManagement />);
    expect(screen.getByText(/dispute management/i)).toBeInTheDocument();
  });
});
