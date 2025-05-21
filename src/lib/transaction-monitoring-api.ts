// Transaction Monitoring API
// Client-side integration for transaction monitoring service

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  addDoc,
  getFirestore
} from 'firebase/firestore';

import { db } from './firebase';
import { transactionMonitoringService, TransactionAlert, MonitoringRule } from './transaction-monitoring-service';

class TransactionMonitoringAPI {
  // Get alerts for a specific user
  async getUserAlerts(userId: string) {
    return transactionMonitoringService.getAlerts({ userId });
  }

  // Get all alerts for admin view
  async getAllAlerts(options: {
    status?: 'new' | 'under-review' | 'resolved' | 'false-positive';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    limit?: number;
  } = {}) {
    return transactionMonitoringService.getAlerts(options);
  }

  // Update alert status
  async updateAlertStatus(
    alertId: string, 
    status: 'under-review' | 'resolved' | 'false-positive',
    resolution?: string,
    reviewerId?: string
  ) {
    return transactionMonitoringService.updateAlertStatus(
      alertId, 
      status, 
      resolution, 
      reviewerId
    );
  }

  // Get monitoring rules
  async getMonitoringRules() {
    return transactionMonitoringService.getRules();
  }

  // Update a monitoring rule
  async updateMonitoringRule(ruleId: string, updates: Partial<MonitoringRule>) {
    return transactionMonitoringService.updateRule(ruleId, updates);
  }

  // Generate risk report for a user
  async generateUserRiskReport(userId: string) {
    return transactionMonitoringService.generateUserRiskReport(userId);
  }

  // Check current user's trading status - returns any active alerts or restrictions
  async checkUserTradingStatus(userId: string) {
    try {
      // Check for any active alerts
      const alerts = await transactionMonitoringService.getAlerts({
        userId,
        status: 'new'
      });

      // Check if account is flagged
      const db = getFirestore();
      const flaggedRef = doc(db, 'flaggedAccounts', userId);
      const flaggedDoc = await getDocs(flaggedRef);
      const isFlagged = flaggedDoc.exists;

      // Determine if any critical alerts require immediate attention
      const hasCriticalAlert = alerts.some(alert => alert.severity === 'critical');
      
      return {
        status: hasCriticalAlert || isFlagged ? 'restricted' : 'normal',
        alerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
        isFlagged,
        reason: hasCriticalAlert 
          ? 'Suspicious transaction activity detected'
          : isFlagged 
            ? 'Account flagged for review' 
            : null
      };
    } catch (error) {
      console.error('Error checking user trading status:', error);
      return {
        status: 'normal',
        alerts: 0,
        criticalAlerts: 0,
        isFlagged: false,
        reason: null
      };
    }
  }

  // Initialize the monitoring service
  async initialize() {
    return transactionMonitoringService.initialize();
  }
}

// Create and export an instance of the API
export const transactionMonitoringAPI = new TransactionMonitoringAPI();
