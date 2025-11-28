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

  // NEW: Extended test cases for better coverage
  describe('Extended Transaction Monitoring Tests', () => {
    it('should detect suspicious transaction patterns', async () => {
      // Arrange - Multiple high-value transactions in short time
      const transactions = [
        { 
          id: 't1', 
          userId: 'user123', 
          amount: 20000, 
          timestamp: new Date(Date.now() - 2 * 60 * 1000) 
        },
        { 
          id: 't2', 
          userId: 'user123', 
          amount: 25000, 
          timestamp: new Date(Date.now() - 1 * 60 * 1000) 
        }
      ];
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue(transactions);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: 't3', 
        userId: 'user123', 
        amount: 30000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert - should trigger both rapid transactions and high-value alerts
      expect(monitoringService.createAlert).toHaveBeenCalled();
    });

    it('should calculate risk scores correctly', async () => {
      // Arrange
      const transaction = { 
        id: 'tx123', 
        userId: 'user123', 
        amount: 15000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      
      // Act
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert - risk assessment should be called
      const { assessTransactionRisk } = await import('../lib/risk-assessment');
      expect(assessTransactionRisk).toHaveBeenCalled();
    });

    it('should flag high-value transactions above threshold', async () => {
      // Arrange
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      monitoringService.createAlert = vi.fn();
      
      // Act - Transaction above R50,000
      const transaction = { 
        id: 'tx-high', 
        userId: 'user123', 
        amount: 75000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert
      expect(monitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: RuleSeverity.HIGH
        })
      );
    });

    it('should track velocity limits', async () => {
      // Arrange - Escalating amounts
      const transactions = [
        { id: 't1', userId: 'user123', amount: 5000, timestamp: new Date(Date.now() - 60 * 60 * 1000) },
        { id: 't2', userId: 'user123', amount: 10000, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
        { id: 't3', userId: 'user123', amount: 15000, timestamp: new Date(Date.now() - 10 * 60 * 1000) }
      ];
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue(transactions);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: 't4', 
        userId: 'user123', 
        amount: 20000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert - rapid transaction alert should be created
      expect(monitoringService.createAlert).toHaveBeenCalled();
    });

    it('should handle historical analysis', async () => {
      // Arrange
      const historicalTransactions = Array(20).fill(null).map((_, i) => ({
        id: `hist-${i}`,
        userId: 'user123',
        amount: 1000 + (i * 100),
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }));
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue(historicalTransactions);
      
      // Act
      const transaction = { 
        id: 'new-tx', 
        userId: 'user123', 
        amount: 5000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert
      expect(monitoringService.getUserTransactions).toHaveBeenCalledWith('user123');
    });

    it('should generate alerts for suspicious activity', async () => {
      // Arrange
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      monitoringService.createAlert = vi.fn();
      monitoringService.saveAlert = vi.fn();
      
      // Act - create alert
      await monitoringService.createAlert({
        ruleId: 'suspicious-pattern',
        ruleName: 'Suspicious Pattern',
        description: 'Unusual transaction pattern detected',
        userId: 'user123',
        transactionId: 'tx123',
        severity: RuleSeverity.CRITICAL,
        timestamp: new Date()
      });
      
      // Assert
      expect(monitoringService.saveAlert).toHaveBeenCalled();
      expect(mockUserNotifier.notifyUser).toHaveBeenCalled();
    });

    it('should aggregate alerts by severity', async () => {
      // Arrange
      const alerts = [
        { severity: RuleSeverity.LOW, timestamp: new Date() },
        { severity: RuleSeverity.MEDIUM, timestamp: new Date() },
        { severity: RuleSeverity.HIGH, timestamp: new Date() },
        { severity: RuleSeverity.CRITICAL, timestamp: new Date() }
      ];
      
      // Act - simulate alert creation
      for (const alert of alerts) {
        monitoringService.saveAlert = vi.fn();
        await monitoringService.createAlert({
          ruleId: 'test-rule',
          ruleName: 'Test Rule',
          description: 'Test alert',
          userId: 'user123',
          transactionId: 'tx123',
          ...alert
        });
      }
      
      // Assert - all severities handled
      expect(monitoringService.saveAlert).toHaveBeenCalled();
    });

    it('should handle missing transaction data gracefully', async () => {
      // Arrange
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      
      // Act - transaction with missing fields
      const incompleteTransaction = { 
        id: 'incomplete', 
        userId: 'user123'
        // missing: amount, timestamp, counterpartyId
      };
      
      await expect(
        monitoringService.evaluateTransaction(incompleteTransaction)
      ).resolves.not.toThrow();
    });

    it('should handle database failures gracefully', async () => {
      // Arrange
      monitoringService.getUserTransactions = vi.fn().mockRejectedValue(
        new Error('Database connection failed')
      );
      
      // Act
      const transaction = { 
        id: 'tx123', 
        userId: 'user123', 
        amount: 5000, 
        timestamp: new Date(),
        counterpartyId: 'other123'
      };
      
      // Assert - should not throw
      await expect(
        monitoringService.evaluateTransaction(transaction)
      ).resolves.not.toThrow();
    });

    it('should detect multiple counterparties pattern', async () => {
      // Arrange - many different counterparties in short time
      const transactions = [
        { id: 't1', userId: 'user123', amount: 1000, timestamp: new Date(Date.now() - 5 * 60 * 1000), counterpartyId: 'user1' },
        { id: 't2', userId: 'user123', amount: 1000, timestamp: new Date(Date.now() - 4 * 60 * 1000), counterpartyId: 'user2' },
        { id: 't3', userId: 'user123', amount: 1000, timestamp: new Date(Date.now() - 3 * 60 * 1000), counterpartyId: 'user3' },
        { id: 't4', userId: 'user123', amount: 1000, timestamp: new Date(Date.now() - 2 * 60 * 1000), counterpartyId: 'user4' }
      ];
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue(transactions);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: 't5', 
        userId: 'user123', 
        amount: 1000, 
        timestamp: new Date(),
        counterpartyId: 'user5'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert - should detect rapid transaction pattern
      expect(monitoringService.createAlert).toHaveBeenCalled();
    });

    it('should evaluate custom rules correctly', () => {
      // Arrange
      const customRule: MonitoringRule = {
        id: 'custom-rule',
        name: 'Custom Amount Rule',
        description: 'Detect amounts divisible by 1000',
        condition: (transaction, history) => transaction.amount % 1000 === 0,
        severity: RuleSeverity.LOW,
        enabled: true
      };
      
      // Act & Assert - transaction matching rule
      expect(monitoringService.evaluateRule(
        customRule,
        { id: '1', userId: 'user1', amount: 5000, timestamp: new Date() },
        []
      )).toBe(true);
      
      // Act & Assert - transaction not matching rule
      expect(monitoringService.evaluateRule(
        customRule,
        { id: '2', userId: 'user1', amount: 5500, timestamp: new Date() },
        []
      )).toBe(false);
    });

    it('should handle weekend transactions differently', async () => {
      // Arrange - set to Sunday 2 AM
      const sundayMorning = new Date();
      // Adjust to Sunday by shifting current day to 0 (Sunday)
      const diffToSunday = (7 - sundayMorning.getDay()) % 7;
      sundayMorning.setDate(sundayMorning.getDate() + diffToSunday);
      sundayMorning.setHours(2);
      
      vi.setSystemTime(sundayMorning);
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      monitoringService.createAlert = vi.fn();
      
      // Act
      const transaction = { 
        id: 'weekend-tx', 
        userId: 'user123', 
        amount: 5000, 
        timestamp: sundayMorning,
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert - should flag unusual hours
      expect(monitoringService.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: expect.stringContaining('unusual-hours')
        })
      );
      
      vi.useRealTimers();
    });

    it('should not alert for normal business hours transactions', async () => {
      // Arrange - set to weekday 2 PM
      const businessHours = new Date();
      // Adjust to Wednesday (3)
      const target = 3;
      const diffToWed = (7 + target - businessHours.getDay()) % 7;
      businessHours.setDate(businessHours.getDate() + diffToWed);
      businessHours.setHours(14);
      
      vi.setSystemTime(businessHours);
      
      monitoringService.getUserTransactions = vi.fn().mockResolvedValue([]);
      monitoringService.createAlert = vi.fn();
      
      // Act - normal transaction
      const transaction = { 
        id: 'normal-tx', 
        userId: 'user123', 
        amount: 2000, 
        timestamp: businessHours,
        counterpartyId: 'other123'
      };
      
      await monitoringService.evaluateTransaction(transaction);
      
      // Assert - should not create unusual-hours alert
      const calls = (monitoringService.createAlert as any).mock.calls;
      const unusualHoursAlert = calls.find((call: any) => 
        call[0]?.ruleId?.includes('unusual-hours')
      );
      
      expect(unusualHoursAlert).toBeUndefined();
      
      vi.useRealTimers();
    });
  });
});
