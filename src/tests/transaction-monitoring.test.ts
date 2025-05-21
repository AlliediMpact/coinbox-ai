import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  TransactionMonitoringService,
  MonitoringRule,
  RuleSeverity,
  TransactionAlert
} from '../lib/transaction-monitoring-service';

// Mock Firebase
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date())
  };
});

vi.mock('../lib/risk-assessment', () => ({
  assessTransactionRisk: vi.fn().mockResolvedValue({
    riskScore: 30,
    riskLevel: 'low',
    riskFactors: ['normal-behavior']
  }),
  reportRiskEvent: vi.fn(),
  RiskEvent: {
    SUSPICIOUS_TRANSACTION: 'suspicious-transaction',
    UNUSUAL_PATTERN: 'unusual-pattern'
  }
}));

describe('TransactionMonitoringService', () => {
  let monitoringService: TransactionMonitoringService;
  const mockUserNotifier = {
    notifyUser: vi.fn()
  };
  
  beforeEach(() => {
    monitoringService = new TransactionMonitoringService(mockUserNotifier);
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('evaluateTransaction', () => {
    it('should detect rapid transactions', async () => {
      // Arrange
      const transactions = [
        { 
          id: '1', 
          userId: 'user123', 
          amount: 1000, 
          timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        { 
          id: '2', 
          userId: 'user123', 
          amount: 2000, 
          timestamp: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
        }
      ];
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue(transactions);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: '3', 
        userId: 'user123', 
        amount: 3000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert
      expect(monitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: expect.stringContaining('rapid-transactions'),
          severity: RuleSeverity.MEDIUM,
          userId: 'user123',
          transactionId: '3'
        })
      );
    });
    
    it('should detect unusual hour transactions', async () => {
      // Arrange
      const currentDate = new Date();
      currentDate.setHours(3); // 3 AM
      
      vi.setSystemTime(currentDate);
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: '4', 
        userId: 'user123', 
        amount: 1000, 
        timestamp: currentDate,
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert
      expect(monitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: expect.stringContaining('unusual-hours'),
          severity: RuleSeverity.LOW,
          userId: 'user123',
          transactionId: '4'
        })
      );
      
      vi.useRealTimers();
    });
    
    it('should detect high-value transactions', async () => {
      // Arrange
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: '5', 
        userId: 'user123', 
        amount: 100000, // R100,000
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert
      expect(monitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: expect.stringContaining('high-value'),
          severity: RuleSeverity.HIGH,
          userId: 'user123',
          transactionId: '5'
        })
      );
    });
  });
  
  describe('evaluateRule', () => {
    it('should evaluate rule condition correctly', () => {
      // Arrange
      const rule: MonitoringRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Rule for testing',
        condition: (transaction, history) => transaction.amount > 1000,
        severity: RuleSeverity.MEDIUM,
        enabled: true
      };
      
      // Act & Assert
      expect(monitoringService.evaluateRule(
        rule,
        { id: '1', userId: 'user1', amount: 2000, timestamp: new Date() },
        []
      )).toBe(true);
      
      expect(monitoringService.evaluateRule(
        rule,
        { id: '2', userId: 'user1', amount: 500, timestamp: new Date() },
        []
      )).toBe(false);
    });
  });
  
  describe('createAlert', () => {
    it('should create alert and notify user for high severity', async () => {
      // Arrange
      monitoringService.saveAlert = vi.fn();
      
      // Act
      await monitoringService.createAlert({
        ruleId: 'high-value',
        ruleName: 'High Value Transaction',
        description: 'Transaction exceeds R50,000',
        userId: 'user123',
        transactionId: 'tx123',
        severity: RuleSeverity.HIGH,
        timestamp: new Date()
      });
      
      // Assert
      expect(monitoringService.saveAlert).toHaveBeenCalled();
      expect(mockUserNotifier.notifyUser).toHaveBeenCalled();
    });
    
    it('should create alert without notification for low severity', async () => {
      // Arrange
      monitoringService.saveAlert = vi.fn();
      
      // Act
      await monitoringService.createAlert({
        ruleId: 'unusual-hours',
        ruleName: 'Unusual Hours',
        description: 'Transaction during unusual hours',
        userId: 'user123',
        transactionId: 'tx124',
        severity: RuleSeverity.LOW,
        timestamp: new Date()
      });
      
      // Assert
      expect(monitoringService.saveAlert).toHaveBeenCalled();
      expect(mockUserNotifier.notifyUser).not.toHaveBeenCalled();
    });
  });
});
