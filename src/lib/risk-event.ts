/**
 * Risk event types for security monitoring
 */
export enum RiskEvent {
  // Transaction related events
  SUSPICIOUS_TRANSACTION = 'suspicious-transaction',
  UNUSUAL_PATTERN = 'unusual-pattern',
  HIGH_VALUE_TRANSACTION = 'high-value-transaction',
  RAPID_TRANSACTIONS = 'rapid-transactions',
  UNUSUAL_HOURS = 'unusual-hours',
  
  // Security related events
  RATE_LIMIT_EXCEEDED = 'rate-limit-exceeded',
  FAILED_LOGIN_ATTEMPTS = 'failed-login-attempts',
  UNUSUAL_LOCATION = 'unusual-location',
  DEVICE_CHANGE = 'device-change',
  
  // Risk assessment events
  RISK_SCORE_CHANGED = 'risk-score-changed',
  RISK_LEVEL_ESCALATION = 'risk-level-escalation',
}

/**
 * Report a risk event to the security monitoring system
 * @param eventType Type of risk event
 * @param data Event data including userId, severity, details
 * @returns Promise that resolves when the event is recorded
 */
export async function reportRiskEvent(
  eventType: RiskEvent, 
  data: {
    userId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
  }
): Promise<void> {
  try {
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const db = getFirestore();
    
    await addDoc(collection(db, 'security_events'), {
      eventType,
      userId: data.userId,
      severity: data.severity,
      details: data.details,
      timestamp: serverTimestamp(),
      processed: false
    });
    
    // If this is a high severity event, trigger immediate notification
    if (data.severity === 'high' || data.severity === 'critical') {
      const { notificationService } = await import('./notification-service');
      await notificationService.notifySecurityTeam({
        type: 'security_alert',
        message: `High severity ${eventType} detected for user ${data.userId}`,
        details: data.details
      });
    }
  } catch (error) {
    console.error('Failed to report risk event:', error);
    // Don't throw - security reporting should not break core functionality
  }
}

/**
 * Assess the risk of a specific transaction
 * @param transaction Transaction data to assess
 * @param history Optional transaction history for context
 * @returns Promise resolving to risk assessment result
 */
export async function assessTransactionRisk(
  transaction: {
    id: string;
    userId: string;
    amount: number;
    counterpartyId?: string;
    timestamp: Date;
  },
  history: Array<{
    id: string;
    userId: string;
    amount: number;
    timestamp: Date;
  }> = []
) {
  const riskFactors: string[] = [];
  let riskScore = 0;
  
  // Check for high value transaction
  if (transaction.amount > 20000) {
    riskFactors.push('high-value-transaction');
    riskScore += 20;
  }
  
  // Check for unusual hours (11pm - 5am)
  const hour = transaction.timestamp.getHours();
  if (hour >= 23 || hour <= 5) {
    riskFactors.push('unusual-hours');
    riskScore += 15;
  }
  
  // Check for rapid transactions
  if (history.length >= 2) {
    // Sort by timestamp (newest first)
    const sortedHistory = [...history].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    // Check if there are 3+ transactions in the last hour
    const oneHourAgo = new Date(transaction.timestamp.getTime() - 60 * 60 * 1000);
    const recentTransactions = sortedHistory.filter(tx => 
      tx.timestamp >= oneHourAgo
    );
    
    if (recentTransactions.length >= 2) {
      riskFactors.push('rapid-transactions');
      riskScore += 25;
    }
    
    // Check for escalating amounts
    const isEscalating = sortedHistory.length >= 3 && 
      sortedHistory[0].amount < transaction.amount &&
      sortedHistory[1].amount < sortedHistory[0].amount &&
      sortedHistory[2].amount < sortedHistory[1].amount;
    
    if (isEscalating) {
      riskFactors.push('escalating-amounts');
      riskScore += 30;
    }
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore < 30) {
    riskLevel = 'low';
  } else if (riskScore < 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  return {
    transactionId: transaction.id,
    riskScore,
    riskLevel,
    riskFactors
  };
}
