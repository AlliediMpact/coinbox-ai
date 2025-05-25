import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiptManager from '@/components/payments/ReceiptManager';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import EnhancedDisputeManagement from '@/components/disputes/EnhancedDisputeManagement';
import { AuthContext } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('@/lib/receipt-service', () => ({
  receiptService: {
    getUserReceipts: jest.fn().mockResolvedValue([]),
    generateReceipt: jest.fn().mockResolvedValue({ id: 'test-receipt' }),
  }
}));

jest.mock('@/lib/analytics-service', () => ({
  analyticsService: {
    getTransactionAnalytics: jest.fn().mockResolvedValue({ data: [] }),
    getUserAnalytics: jest.fn().mockResolvedValue({ data: [] }),
    getSystemPerformanceMetrics: jest.fn().mockResolvedValue({ data: [] }),
  }
}));

jest.mock('@/lib/dispute-resolution-service', () => ({
  disputeResolutionService: {
    getUserDisputes: jest.fn().mockResolvedValue([]),
    getDisputeDetails: jest.fn().mockResolvedValue(null),
  }
}));

// Mock auth context
const mockAuthContext = {
  user: { uid: 'test-user-id', email: 'test@example.com' },
  loading: false,
  signin: jest.fn(),
  signup: jest.fn(),
  signout: jest.fn(),
  sendPasswordReset: jest.fn(),
  updateProfile: jest.fn(),
};

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('Component Integration Tests', () => {
  test('ReceiptManager renders without errors', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ReceiptManager />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/receipts/i)).toBeInTheDocument();
  });

  test('AnalyticsDashboard renders without errors', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <AnalyticsDashboard />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
  });

  test('EnhancedDisputeManagement renders without errors', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <EnhancedDisputeManagement />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/disputes/i)).toBeInTheDocument();
  });
});
