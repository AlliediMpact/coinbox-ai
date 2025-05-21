import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionMonitoring from '../components/admin/TransactionMonitoring';
import { useAuth } from '../components/AuthProvider';

// Mock Auth Provider
vi.mock('../components/AuthProvider', () => ({
  useAuth: vi.fn()
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
}));

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

describe('Admin Transaction Monitoring', () => {
  beforeEach(() => {
    // Setup auth mock
    (useAuth as any).mockReturnValue({
      user: { uid: 'admin-user-123' }
    });
    
    // Setup Firestore mocks
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'alert-1',
          data: () => ({
            userId: 'user-123',
            userEmail: 'user@example.com',
            transactionId: 'tx-456',
            ruleId: 'rapid-transactions',
            ruleName: 'Rapid Transactions',
            description: 'Multiple transactions in short period',
            severity: 'medium',
            timestamp: new Date(),
            status: 'open',
            transactionAmount: 5000
          })
        },
        {
          id: 'alert-2',
          data: () => ({
            userId: 'user-789',
            userEmail: 'another@example.com',
            transactionId: 'tx-123',
            ruleId: 'high-value',
            ruleName: 'High Value Transaction',
            description: 'Transaction exceeds R20,000',
            severity: 'high',
            timestamp: new Date(),
            status: 'reviewing',
            transactionAmount: 25000
          })
        }
      ]
    });
    
    // Mock rules response
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        rules: [
          {
            id: 'rapid-transactions',
            name: 'Rapid Transactions',
            description: 'Detect multiple transactions in a short time period',
            enabled: true,
            severity: 'medium',
            threshold: 3,
            timeWindowMinutes: 60
          },
          {
            id: 'high-value',
            name: 'High Value Transaction',
            description: 'Detect transactions above threshold value',
            enabled: true,
            severity: 'high',
            threshold: 20000
          }
        ]
      })
    });
  });
  
  it('renders the alerts tab with alert data', async () => {
    // Arrange & Act
    render(<TransactionMonitoring />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Rapid Transactions')).toBeInTheDocument();
      expect(screen.getByText('High Value Transaction')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('another@example.com')).toBeInTheDocument();
    });
  });
  
  it('allows filtering alerts by status', async () => {
    // Arrange
    render(<TransactionMonitoring />);
    
    // Act - Filter by reviewing status
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Reviewing'));
    
    // Assert
    await waitFor(() => {
      expect(screen.queryByText('Multiple transactions in short period')).not.toBeInTheDocument();
      expect(screen.getByText('Transaction exceeds R20,000')).toBeInTheDocument();
    });
  });
  
  it('allows filtering alerts by severity', async () => {
    // Arrange
    render(<TransactionMonitoring />);
    
    // Act - Filter by high severity
    await waitFor(() => {
      expect(screen.getByText('All Severities')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('All Severities'));
    fireEvent.click(screen.getByText('High'));
    
    // Assert
    await waitFor(() => {
      expect(screen.queryByText('Multiple transactions in short period')).not.toBeInTheDocument();
      expect(screen.getByText('Transaction exceeds R20,000')).toBeInTheDocument();
    });
  });
  
  it('switches to rules tab and displays rules', async () => {
    // Arrange
    render(<TransactionMonitoring />);
    
    // Act - Switch to Rules tab
    await waitFor(() => {
      expect(screen.getByText('Rules')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Rules'));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Rapid Transactions')).toBeInTheDocument();
      expect(screen.getByText('Detect multiple transactions in a short time period')).toBeInTheDocument();
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
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByText('Alert Details')).toBeInTheDocument();
    });
  });
});
