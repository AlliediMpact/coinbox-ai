import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock modules BEFORE importing components to ensure mocks apply
vi.mock('../components/AuthProvider', () => ({ useAuth: vi.fn() }));

// Mock transaction monitoring API instead of Firestore internals
vi.mock('@/lib/transaction-monitoring-api', () => {
  const userAlerts = [
    {
      id: 'alert-1',
      ruleId: 'rapid-transactions',
      ruleName: 'Rapid Transactions',
      description: 'Multiple transactions in short period',
      severity: 'medium',
      detectedAt: new Date(),
      status: 'new',
      userId: 'test-user-123',
      transactions: [],
      transactionAmount: 1200
    },
    {
      id: 'alert-2',
      ruleId: 'high-value',
      ruleName: 'High Value Transaction',
      description: 'Transaction exceeds R20,000',
      severity: 'high',
      detectedAt: new Date(),
      status: 'under-review',
      userId: 'test-user-123',
      transactions: [],
      transactionAmount: 25000
    }
  ];
  return {
    transactionMonitoringAPI: {
      checkUserTradingStatus: vi.fn(async () => ({
        status: 'normal',
        alerts: userAlerts.length,
        criticalAlerts: 1,
        isFlagged: false,
        reason: null
      })),
      getUserAlerts: vi.fn(async () => userAlerts)
    }
  };
});

// Now import component and hooks that will see the mocks
import TransactionSecurity from '../components/TransactionSecurity';
import { useAuth } from '../components/AuthProvider';

describe('Transaction Security UI', () => {
  beforeEach(() => {
    (useAuth as any).mockReturnValue({ user: { uid: 'test-user-123' } });
  });
  
  it('renders the security status section', async () => {
    // Arrange & Act
    render(<TransactionSecurity />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Transaction Security Status')).toBeInTheDocument();
      expect(screen.getByText(/Trading Status:/)).toBeInTheDocument();
    });
  });
  
  it('displays security alerts', async () => {
    // Arrange & Act
    render(<TransactionSecurity />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Security Alerts')).toBeInTheDocument();
      expect(screen.getByText('Rapid Transactions')).toBeInTheDocument();
    });
  });
  
  // Filtering and empty-state behaviors covered elsewhere; here we assert baseline render only.
});
