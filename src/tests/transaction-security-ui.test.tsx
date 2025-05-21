import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionSecurity from '../components/TransactionSecurity';
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
  onSnapshot: vi.fn(() => () => {}),
}));

describe('Transaction Security UI', () => {
  beforeEach(() => {
    // Setup auth mock
    (useAuth as any).mockReturnValue({
      user: { uid: 'test-user-123' }
    });
    
    // Setup Firestore mocks
    const { getDoc } = require('firebase/firestore');
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        status: 'active',
        riskScore: 15
      })
    });
    
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'alert-1',
          data: () => ({
            ruleId: 'rapid-transactions',
            ruleName: 'Rapid Transactions',
            description: 'Multiple transactions in short period',
            severity: 'medium',
            timestamp: new Date(),
            status: 'open'
          })
        },
        {
          id: 'alert-2',
          data: () => ({
            ruleId: 'high-value',
            ruleName: 'High Value Transaction',
            description: 'Transaction exceeds R20,000',
            severity: 'high',
            timestamp: new Date(),
            status: 'open'
          })
        }
      ]
    });
    
    const { onSnapshot } = require('firebase/firestore');
    onSnapshot.mockImplementation((query, callback) => {
      callback({
        empty: false,
        docs: [
          {
            id: 'alert-1',
            data: () => ({
              ruleId: 'rapid-transactions',
              ruleName: 'Rapid Transactions',
              description: 'Multiple transactions in short period',
              severity: 'medium',
              timestamp: new Date(),
              status: 'open'
            })
          }
        ]
      });
      return () => {};
    });
  });
  
  it('renders the security status section', async () => {
    // Arrange & Act
    render(<TransactionSecurity />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Security Status')).toBeInTheDocument();
      expect(screen.getByText(/Overall Risk Score/)).toBeInTheDocument();
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
  
  it('allows filtering alerts by severity', async () => {
    // Arrange
    render(<TransactionSecurity />);
    
    // Act
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('High'));
    
    // Assert
    await waitFor(() => {
      // Filtering for High should hide the medium severity alert
      expect(screen.queryByText('Multiple transactions in short period')).not.toBeInTheDocument();
    });
  });
  
  it('shows empty state when no alerts', async () => {
    // Arrange
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({
      empty: true,
      docs: []
    });
    
    // Act
    render(<TransactionSecurity />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/No security alerts/)).toBeInTheDocument();
    });
  });
});
