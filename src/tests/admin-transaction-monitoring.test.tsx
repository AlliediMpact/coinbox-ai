import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock modules BEFORE importing components to ensure mocks apply
vi.mock('../components/AuthProvider', () => ({ useAuth: vi.fn() }));

// Mock transaction monitoring API directly (bypass Firestore layer)
vi.mock('@/lib/transaction-monitoring-api', () => {
  const alerts = [
    {
      id: 'alert-1',
      ruleId: 'rapid-transactions',
      ruleName: 'Rapid Transactions',
      description: 'Multiple transactions in short period',
      severity: 'medium',
      detectedAt: new Date(),
      status: 'new',
      userId: 'user-123',
      transactions: [],
      transactionAmount: 5000
    },
    {
      id: 'alert-2',
      ruleId: 'high-value',
      ruleName: 'High Value Transaction',
      description: 'Transaction exceeds R20,000',
      severity: 'high',
      detectedAt: new Date(),
      status: 'under-review',
      userId: 'user-789',
      transactions: [],
      transactionAmount: 25000
    }
  ];
  const rules = [
    {
      id: 'rapid-transactions',
      name: 'Rapid Transactions',
      description: 'Detect multiple transactions in a short time period',
      severity: 'medium',
      enabled: true,
      thresholds: { timeWindow: 60 },
      updatedAt: new Date()
    },
    {
      id: 'high-value',
      name: 'High Value Transaction',
      description: 'Detect transactions above threshold value',
      severity: 'high',
      enabled: true,
      thresholds: { minAmount: 20000 },
      updatedAt: new Date()
    }
  ];
  return {
    transactionMonitoringAPI: {
      getAllAlerts: vi.fn(async () => alerts),
      getMonitoringRules: vi.fn(async () => rules),
      updateAlertStatus: vi.fn(async () => ({})),
      updateMonitoringRule: vi.fn(async () => ({}))
    }
  };
});

// Mock Dialog
vi.mock('../components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

// Now import components and hooks that will see the mocks
import TransactionMonitoring from '../components/admin/TransactionMonitoring';
import { useAuth } from '../components/AuthProvider';

describe('Admin Transaction Monitoring', () => {
  beforeEach(() => {
    (useAuth as any).mockReturnValue({ user: { uid: 'admin-user-123' } });
  });
  
  it('renders the security alerts tab with alert data', async () => {
    // Arrange & Act
    render(<TransactionMonitoring />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Security Alerts')).toBeInTheDocument();
      expect(screen.getByText('Rapid Transactions')).toBeInTheDocument();
      expect(screen.getByText('High Value Transaction')).toBeInTheDocument();
    });
  });
  
  it('opens alert detail dialog when clicking on alert', async () => {
    // Arrange
    render(<TransactionMonitoring />);
    
    // Act
    await waitFor(() => {
      expect(screen.getByText('Rapid Transactions')).toBeInTheDocument();
    });
    
    // Find and click the first alert row
    const alertRows = screen.getAllByRole('row');
    fireEvent.click(alertRows[1]); // First row after header
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Alert Details')).toBeInTheDocument();
    });
  });
});
