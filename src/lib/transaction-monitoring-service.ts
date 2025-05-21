// Transaction Monitoring Service
// Provides real-time monitoring and analysis of transaction patterns to detect fraud and suspicious activity

import { 
  getFirestore, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from './firebase-admin';
import { TradeTicket } from './types';
import { getRiskAssessment, assessTransactionRisk, reportRiskEvent, RiskEvent } from './risk-assessment';
import { notificationService } from './notification-service';

// Types for transaction monitoring
export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  thresholds: {
    timeWindow: number; // in minutes
    maxTransactions?: number;
    maxAmount?: number;
    minAmount?: number;
    patternType?: 'rapid' | 'escalating' | 'unusual-hours' | 'multiple-counterparties';
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // New properties for adaptive thresholds
  adaptiveThreshold?: boolean;
  userRiskProfileAdjustment?: boolean;
  timeOfDayAdjustment?: boolean;
  behavioralBaseline?: {
    learningPeriodDays: number;
    deviationThreshold: number;
  };
}

export interface TransactionAlert {
  id?: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  transactions: string[]; // Array of transaction IDs
  detectedAt: Date;
  status: 'new' | 'under-review' | 'resolved' | 'false-positive';
  resolution?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// Helper functions for time calculations
const minutesToMilliseconds = (minutes: number) => minutes * 60 * 1000;
const hourIsOutsideBusinessHours = (hour: number) => hour < 8 || hour > 18;

class TransactionMonitoringService {
  private defaultRules: MonitoringRule[] = [
    {
      id: 'rapid-transactions',
      name: 'Rapid Transactions',
      description: 'Multiple transactions in a short time window',
      thresholds: {
        timeWindow: 10, // 10 minutes
        maxTransactions: 5,
        patternType: 'rapid'
      },
      severity: 'medium',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'unusual-hours',
      name: 'Unusual Hours Activity',
      description: 'Transactions outside normal business hours',
      thresholds: {
        timeWindow: 60,
        patternType: 'unusual-hours'
      },
      severity: 'low',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'high-value',
      name: 'High-Value Transaction',
      description: 'Single high-value transaction',
      thresholds: {
        timeWindow: 60,
        minAmount: 10000
      },
      severity: 'high',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'multiple-counterparties',
      name: 'Multiple Counterparties',
      description: 'Transactions with many different counterparties in short period',
      thresholds: {
        timeWindow: 60,
        patternType: 'multiple-counterparties'
      },
      severity: 'medium',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'escalating-amounts',
      name: 'Escalating Transaction Amounts',
      description: 'Increasingly large transactions in a sequence',
      thresholds: {
        timeWindow: 1440, // 24 hours
        patternType: 'escalating'
      },
      severity: 'high',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Initialize the service and ensure default rules exist
  async initialize() {
    try {
      // Check if default rules exist, if not, create them
      const rulesCollection = collection(db, 'monitoringRules');
      const rulesSnapshot = await getDocs(rulesCollection);
      
      if (rulesSnapshot.empty) {
        // Create default rules
        for (const rule of this.defaultRules) {
          await addDoc(collection(db, 'monitoringRules'), rule);
        }
        console.log('Created default transaction monitoring rules');
      }

      // Setup listeners for transactions
      this.setupTransactionListeners();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize transaction monitoring service:', error);
      return { success: false, error };
    }
  }

  // Set up real-time listeners for new transactions
  private setupTransactionListeners() {
    // Listen for new tickets
    const ticketsRef = collection(db, 'tickets');
    const ticketsQuery = query(
      ticketsRef,
      where('status', 'in', ['Open', 'Escrow', 'Completed']),
      orderBy('createdAt', 'desc')
    );

    // Set up the listener
    onSnapshot(ticketsQuery, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const ticket = { id: change.doc.id, ...change.doc.data() } as TradeTicket;
            this.analyzeTransaction(ticket);
          }
        });
      },
      (error) => {
        console.error('Transaction monitoring listener error:', error);
      }
    );
  }

  // Analyze a transaction against all enabled rules
  async analyzeTransaction(transaction: TradeTicket) {
    try {
      // Get all enabled rules
      const rulesQuery = query(
        collection(db, 'monitoringRules'),
        where('enabled', '==', true)
      );
      
      const rulesSnapshot = await getDocs(rulesQuery);
      const enabledRules = rulesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MonitoringRule));

      // Check transaction against each rule
      for (const rule of enabledRules) {
        const isViolation = await this.checkRuleViolation(transaction, rule);
        
        if (isViolation) {
          await this.createAlert(transaction, rule);
        }
      }
    } catch (error) {
      console.error('Error analyzing transaction:', error);
    }
  }

  // Check if a transaction violates a specific rule
  private async checkRuleViolation(transaction: TradeTicket, rule: MonitoringRule): Promise<boolean> {
    const { userId, amount, createdAt } = transaction;
    const { thresholds } = rule;
    
    // Check for minimum amount threshold
    if (thresholds.minAmount && amount < thresholds.minAmount) {
      return false;
    }
    
    // Check for maximum amount threshold
    if (thresholds.maxAmount && amount > thresholds.maxAmount) {
      return true;
    }

    // Get the time window for analysis
    const lookbackTime = new Date();
    lookbackTime.setMinutes(lookbackTime.getMinutes() - thresholds.timeWindow);

    // Query for recent transactions from this user
    const recentTransactionsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', userId),
      where('createdAt', '>=', lookbackTime),
      orderBy('createdAt', 'asc')
    );
    
    const recentTransactionsSnapshot = await getDocs(recentTransactionsQuery);
    const recentTransactions = recentTransactionsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as TradeTicket));

    // Check transaction count
    if (thresholds.maxTransactions && recentTransactions.length > thresholds.maxTransactions) {
      return true;
    }

    // Check for specific patterns
    switch (thresholds.patternType) {
      case 'rapid':
        // If we have multiple transactions in a very short window
        return recentTransactions.length >= 3;
        
      case 'escalating':
        // Check for escalating amounts
        if (recentTransactions.length >= 3) {
          let isEscalating = true;
          for (let i = 1; i < recentTransactions.length; i++) {
            if (recentTransactions[i].amount <= recentTransactions[i-1].amount) {
              isEscalating = false;
              break;
            }
          }
          return isEscalating && recentTransactions[recentTransactions.length-1].amount >= 1.5 * recentTransactions[0].amount;
        }
        return false;
        
      case 'unusual-hours':
        // Check if transaction is outside business hours
        const transactionDate = new Date(createdAt instanceof Date ? createdAt : createdAt.toDate());
        const hour = transactionDate.getHours();
        return hourIsOutsideBusinessHours(hour);
        
      case 'multiple-counterparties':
        // Check if user is dealing with multiple different counterparties
        const counterpartyIds = new Set(
          recentTransactions
            .filter(t => t.matchedTicketId)
            .map(t => t.matchedTicketId)
        );
        return counterpartyIds.size >= 3;
        
      default:
        return false;
    }
  }

  // Create an alert for a rule violation
  private async createAlert(transaction: TradeTicket, rule: MonitoringRule) {
    try {
      // Create alert object
      const alert: Omit<TransactionAlert, 'id'> = {
        userId: transaction.userId,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        transactions: [transaction.id],
        detectedAt: new Date(),
        status: 'new'
      };
      
      // Check if there's already an open alert for this rule and user
      const existingAlertQuery = query(
        collection(db, 'transactionAlerts'),
        where('userId', '==', transaction.userId),
        where('ruleId', '==', rule.id),
        where('status', 'in', ['new', 'under-review'])
      );
      
      const existingAlertSnapshot = await getDocs(existingAlertQuery);
      
      if (!existingAlertSnapshot.empty) {
        // Update existing alert
        const existingAlert = existingAlertSnapshot.docs[0];
        const existingData = existingAlert.data() as TransactionAlert;
        
        // Only add the transaction if it's not already in the list
        if (!existingData.transactions.includes(transaction.id)) {
          existingData.transactions.push(transaction.id);
        }
        
        await updateDoc(existingAlert.ref, {
          transactions: existingData.transactions,
          updatedAt: new Date()
        });
      } else {
        // Create new alert
        await addDoc(collection(db, 'transactionAlerts'), alert);
        
        // Send notification to user
        await notificationService.createNotification({
          userId: transaction.userId,
          type: 'security',
          title: 'Unusual Trading Activity Detected',
          message: `We've identified potentially unusual activity in your recent trading pattern. Please review your account for security.`,
          priority: rule.severity === 'high' || rule.severity === 'critical' ? 'high' : 'medium'
        });
        
        // If high or critical severity, also notify admins
        if (rule.severity === 'high' || rule.severity === 'critical') {
          await this.notifyAdmins(transaction, rule);
        }
      }
    } catch (error) {
      console.error('Error creating transaction alert:', error);
    }
  }

  // Send notifications to admin users
  private async notifyAdmins(transaction: TradeTicket, rule: MonitoringRule) {
    try {
      // Query for admin users
      const adminsQuery = query(
        collection(db, 'users'),
        where('roles', 'array-contains', 'admin')
      );
      
      const adminsSnapshot = await getDocs(adminsQuery);
      
      // Send notification to each admin
      for (const adminDoc of adminsSnapshot.docs) {
        const adminId = adminDoc.id;
        
        await notificationService.createNotification({
          userId: adminId,
          type: 'admin',
          title: `${rule.severity.toUpperCase()} Security Alert`,
          message: `Suspicious transaction detected. User ID: ${transaction.userId}, Amount: R${transaction.amount}, Rule: ${rule.name}`,
          priority: 'high',
          metadata: {
            transactionId: transaction.id,
            userId: transaction.userId
          }
        });
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  // Get all alerts, with optional filtering
  async getAlerts(options: {
    userId?: string;
    status?: 'new' | 'under-review' | 'resolved' | 'false-positive';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
  } = {}) {
    try {
      let alertsQuery: any = collection(db, 'transactionAlerts');
      const queryFilters = [];
      
      // Apply filters
      if (options.userId) {
        queryFilters.push(where('userId', '==', options.userId));
      }
      
      if (options.status) {
        queryFilters.push(where('status', '==', options.status));
      }
      
      if (options.severity) {
        queryFilters.push(where('severity', '==', options.severity));
      }
      
      // Apply all filters and ordering
      alertsQuery = query(
        alertsQuery,
        ...queryFilters,
        orderBy('detectedAt', 'desc'),
        options.limit ? limit(options.limit) : limit(100)
      );
      
      const alertsSnapshot = await getDocs(alertsQuery);
      
      return alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TransactionAlert));
    } catch (error) {
      console.error('Error getting transaction alerts:', error);
      return [];
    }
  }

  // Update the status of an alert
  async updateAlertStatus(
    alertId: string, 
    status: 'under-review' | 'resolved' | 'false-positive',
    resolution?: string,
    reviewerId?: string
  ) {
    try {
      const alertRef = doc(db, 'transactionAlerts', alertId);
      
      await updateDoc(alertRef, {
        status,
        ...(resolution && { resolution }),
        ...(reviewerId && { reviewedBy: reviewerId }),
        reviewedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating alert status:', error);
      return { success: false, error };
    }
  }

  // Get all monitoring rules
  async getRules() {
    try {
      const rulesSnapshot = await getDocs(collection(db, 'monitoringRules'));
      
      return rulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MonitoringRule));
    } catch (error) {
      console.error('Error getting monitoring rules:', error);
      return [];
    }
  }

  // Update a monitoring rule
  async updateRule(ruleId: string, updates: Partial<MonitoringRule>) {
    try {
      const ruleRef = doc(db, 'monitoringRules', ruleId);
      
      await updateDoc(ruleRef, {
        ...updates,
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating monitoring rule:', error);
      return { success: false, error };
    }
  }

  // Generate risk report for a user based on their transaction history
  async generateUserRiskReport(userId: string) {
    try {
      // Get user's transaction history
      const transactionsQuery = query(
        collection(db, 'tickets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TradeTicket));
      
      // Get user's alerts
      const alertsQuery = query(
        collection(db, 'transactionAlerts'),
        where('userId', '==', userId),
        orderBy('detectedAt', 'desc')
      );
      
      const alertsSnapshot = await getDocs(alertsQuery);
      const alerts = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TransactionAlert));
      
      // Calculate risk metrics
      const totalTransactions = transactions.length;
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
      const alertCount = alerts.length;
      const highSeverityAlerts = alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
      
      // Get risk assessment using existing risk assessment service
      const riskAssessment = await getRiskAssessment({ userId, tradeType: 'General' });
      
      // Calculate combined risk score
      const alertRiskFactor = (alertCount * 5) + (highSeverityAlerts * 15);
      const combinedRiskScore = Math.min(100, riskAssessment.riskScore + alertRiskFactor);
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
      if (combinedRiskScore >= 80) riskLevel = 'extreme';
      else if (combinedRiskScore >= 50) riskLevel = 'high';
      else if (combinedRiskScore >= 20) riskLevel = 'medium';
      
      return {
        userId,
        generated: new Date(),
        transactionMetrics: {
          totalTransactions,
          totalAmount,
          avgAmount,
          firstTransaction: transactions.length > 0 ? transactions[transactions.length - 1].createdAt : null,
          lastTransaction: transactions.length > 0 ? transactions[0].createdAt : null
        },
        alertMetrics: {
          totalAlerts: alertCount,
          highSeverityAlerts,
          recentAlerts: alerts.filter(a => {
            const alertDate = new Date(a.detectedAt instanceof Date ? a.detectedAt : a.detectedAt.toDate());
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return alertDate >= thirtyDaysAgo;
          }).length
        },
        riskAssessment: {
          baseRiskScore: riskAssessment.riskScore,
          combinedRiskScore,
          riskLevel,
          riskFactors: [
            ...riskAssessment.factors,
            ...(alertCount > 0 ? [`${alertCount} security alerts detected`] : []),
            ...(highSeverityAlerts > 0 ? [`${highSeverityAlerts} high-severity alerts detected`] : [])
          ]
        }
      };
    } catch (error) {
      console.error('Error generating user risk report:', error);
      throw error;
    }
  }
}

// Helper function to update Firestore document
async function updateDoc(docRef: any, data: any) {
  await docRef.update(data);
}

// Create and export the service instance
export const transactionMonitoringService = new TransactionMonitoringService();
