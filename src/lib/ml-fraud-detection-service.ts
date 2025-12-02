/**
 * Machine Learning Fraud Detection Service
 * Advanced fraud detection using pattern analysis and anomaly detection
 */

import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface FraudDetectionResult {
  riskScore: number; // 0-100, higher = more suspicious
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';
  confidence: number; // 0-100
  details: {
    velocityCheck?: { suspicious: boolean; reason?: string };
    amountCheck?: { suspicious: boolean; reason?: string };
    patternCheck?: { suspicious: boolean; reason?: string };
    locationCheck?: { suspicious: boolean; reason?: string };
    deviceCheck?: { suspicious: boolean; reason?: string };
    behaviorCheck?: { suspicious: boolean; reason?: string };
  };
}

export interface TransactionPattern {
  userId: string;
  averageAmount: number;
  transactionFrequency: number; // per day
  usualHours: number[]; // Hours of day user usually transacts
  usualDaysOfWeek: number[]; // Days user usually transacts
  commonRecipients: string[];
  deviceFingerprints: string[];
  locations: string[];
}

class MLFraudDetectionService {
  private db = getFirestore();

  // Thresholds for fraud detection
  private readonly VELOCITY_THRESHOLD = 5; // Max transactions per hour
  private readonly AMOUNT_MULTIPLIER = 3; // Max 3x average amount
  private readonly UNUSUAL_HOUR_WEIGHT = 20; // Risk points for unusual hours
  private readonly NEW_DEVICE_WEIGHT = 15;
  private readonly HIGH_AMOUNT_WEIGHT = 25;

  /**
   * Analyze transaction for fraud indicators
   */
  async analyzeTransaction(
    userId: string,
    amount: number,
    recipientId?: string,
    metadata?: {
      deviceFingerprint?: string;
      ipAddress?: string;
      location?: string;
      hour?: number;
      dayOfWeek?: number;
    }
  ): Promise<FraudDetectionResult> {
    try {
      const pattern = await this.getUserPattern(userId);
      const recentActivity = await this.getRecentActivity(userId);

      let riskScore = 0;
      const flags: string[] = [];
      const details: FraudDetectionResult['details'] = {};

      // 1. Velocity Check - Too many transactions in short time
      const velocityCheck = this.checkVelocity(recentActivity);
      details.velocityCheck = velocityCheck;
      if (velocityCheck.suspicious) {
        riskScore += 30;
        flags.push('High transaction velocity');
      }

      // 2. Amount Check - Unusual transaction amount
      const amountCheck = this.checkAmount(amount, pattern);
      details.amountCheck = amountCheck;
      if (amountCheck.suspicious) {
        riskScore += this.HIGH_AMOUNT_WEIGHT;
        flags.push('Unusual transaction amount');
      }

      // 3. Pattern Check - Unusual time or day
      if (metadata?.hour !== undefined && metadata?.dayOfWeek !== undefined) {
        const patternCheck = this.checkPattern(
          metadata.hour,
          metadata.dayOfWeek,
          pattern
        );
        details.patternCheck = patternCheck;
        if (patternCheck.suspicious) {
          riskScore += this.UNUSUAL_HOUR_WEIGHT;
          flags.push('Unusual transaction time');
        }
      }

      // 4. Device Check - New or unknown device
      if (metadata?.deviceFingerprint) {
        const deviceCheck = this.checkDevice(metadata.deviceFingerprint, pattern);
        details.deviceCheck = deviceCheck;
        if (deviceCheck.suspicious) {
          riskScore += this.NEW_DEVICE_WEIGHT;
          flags.push('New or unknown device');
        }
      }

      // 5. Location Check - Unusual location
      if (metadata?.location) {
        const locationCheck = this.checkLocation(metadata.location, pattern);
        details.locationCheck = locationCheck;
        if (locationCheck.suspicious) {
          riskScore += 20;
          flags.push('Unusual transaction location');
        }
      }

      // 6. Recipient Check - New recipient with high amount
      if (recipientId) {
        const isNewRecipient = !pattern.commonRecipients.includes(recipientId);
        const isHighAmount = amount > pattern.averageAmount * 2;
        if (isNewRecipient && isHighAmount) {
          riskScore += 15;
          flags.push('New recipient with high amount');
          details.behaviorCheck = {
            suspicious: true,
            reason: 'First transaction to this recipient with unusually high amount',
          };
        }
      }

      // Calculate final risk level
      const riskLevel = this.calculateRiskLevel(riskScore);
      const recommendation = this.getRecommendation(riskLevel, riskScore);
      const confidence = this.calculateConfidence(flags.length, pattern);

      return {
        riskScore: Math.min(100, riskScore),
        riskLevel,
        flags,
        recommendation,
        confidence,
        details,
      };
    } catch (error) {
      console.error('Error in fraud detection:', error);
      
      // Default to safe recommendation on error
      return {
        riskScore: 50,
        riskLevel: 'MEDIUM',
        flags: ['Analysis incomplete - review recommended'],
        recommendation: 'REVIEW',
        confidence: 40,
        details: {},
      };
    }
  }

  /**
   * Get user's transaction pattern
   */
  private async getUserPattern(userId: string): Promise<TransactionPattern> {
    try {
      const transactionsRef = collection(this.db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map(doc => doc.data());

      if (transactions.length === 0) {
        // New user - default pattern
        return {
          userId,
          averageAmount: 0,
          transactionFrequency: 0,
          usualHours: [],
          usualDaysOfWeek: [],
          commonRecipients: [],
          deviceFingerprints: [],
          locations: [],
        };
      }

      // Calculate average amount
      const totalAmount = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const averageAmount = totalAmount / transactions.length;

      // Calculate transaction frequency (per day)
      const oldestTx = transactions[transactions.length - 1];
      const daysSinceFirst = oldestTx?.createdAt
        ? (Date.now() - oldestTx.createdAt.toMillis()) / (1000 * 60 * 60 * 24)
        : 1;
      const transactionFrequency = transactions.length / Math.max(daysSinceFirst, 1);

      // Extract usual hours
      const hours = transactions
        .map(tx => tx.createdAt ? new Date(tx.createdAt.toMillis()).getHours() : null)
        .filter((h): h is number => h !== null);
      const usualHours = this.getMostCommon(hours, 3);

      // Extract usual days of week
      const daysOfWeek = transactions
        .map(tx => tx.createdAt ? new Date(tx.createdAt.toMillis()).getDay() : null)
        .filter((d): d is number => d !== null);
      const usualDaysOfWeek = this.getMostCommon(daysOfWeek, 3);

      // Extract common recipients
      const recipients = transactions
        .map(tx => tx.recipientId)
        .filter((r): r is string => r !== null && r !== undefined);
      const commonRecipients = this.getMostCommon(recipients, 5);

      // Extract device fingerprints (mock)
      const deviceFingerprints = ['device_default'];

      // Extract locations (mock)
      const locations = ['location_default'];

      return {
        userId,
        averageAmount,
        transactionFrequency,
        usualHours,
        usualDaysOfWeek,
        commonRecipients,
        deviceFingerprints,
        locations,
      };
    } catch (error) {
      console.error('Error getting user pattern:', error);
      return {
        userId,
        averageAmount: 0,
        transactionFrequency: 0,
        usualHours: [],
        usualDaysOfWeek: [],
        commonRecipients: [],
        deviceFingerprints: [],
        locations: [],
      };
    }
  }

  /**
   * Get recent activity (last 1 hour)
   */
  private async getRecentActivity(userId: string): Promise<any[]> {
    try {
      const transactionsRef = collection(this.db, 'transactions');
      const oneHourAgo = Timestamp.fromMillis(Date.now() - 3600000);

      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        where('createdAt', '>=', oneHourAgo)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Check transaction velocity
   */
  private checkVelocity(recentActivity: any[]): { suspicious: boolean; reason?: string } {
    if (recentActivity.length >= this.VELOCITY_THRESHOLD) {
      return {
        suspicious: true,
        reason: `${recentActivity.length} transactions in the last hour (threshold: ${this.VELOCITY_THRESHOLD})`,
      };
    }
    return { suspicious: false };
  }

  /**
   * Check transaction amount
   */
  private checkAmount(
    amount: number,
    pattern: TransactionPattern
  ): { suspicious: boolean; reason?: string } {
    if (pattern.averageAmount === 0) {
      // First transaction - check if unreasonably high
      if (amount > 50000) {
        return { suspicious: true, reason: 'First transaction with very high amount' };
      }
      return { suspicious: false };
    }

    if (amount > pattern.averageAmount * this.AMOUNT_MULTIPLIER) {
      return {
        suspicious: true,
        reason: `Amount is ${Math.round(amount / pattern.averageAmount)}x user's average`,
      };
    }

    return { suspicious: false };
  }

  /**
   * Check transaction pattern (time/day)
   */
  private checkPattern(
    hour: number,
    dayOfWeek: number,
    pattern: TransactionPattern
  ): { suspicious: boolean; reason?: string } {
    if (pattern.usualHours.length === 0) {
      // New user - no pattern yet
      return { suspicious: false };
    }

    const hourMatch = pattern.usualHours.includes(hour);
    const dayMatch = pattern.usualDaysOfWeek.includes(dayOfWeek);

    if (!hourMatch && !dayMatch) {
      return {
        suspicious: true,
        reason: 'Transaction at unusual time for this user',
      };
    }

    return { suspicious: false };
  }

  /**
   * Check device fingerprint
   */
  private checkDevice(
    deviceFingerprint: string,
    pattern: TransactionPattern
  ): { suspicious: boolean; reason?: string } {
    if (!pattern.deviceFingerprints.includes(deviceFingerprint)) {
      return { suspicious: true, reason: 'Transaction from new or unknown device' };
    }
    return { suspicious: false };
  }

  /**
   * Check location
   */
  private checkLocation(
    location: string,
    pattern: TransactionPattern
  ): { suspicious: boolean; reason?: string } {
    if (!pattern.locations.includes(location)) {
      return { suspicious: true, reason: 'Transaction from new location' };
    }
    return { suspicious: false };
  }

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get recommendation based on risk
   */
  private getRecommendation(
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    score: number
  ): 'APPROVE' | 'REVIEW' | 'BLOCK' {
    if (level === 'CRITICAL' || score >= 80) return 'BLOCK';
    if (level === 'HIGH' || score >= 50) return 'REVIEW';
    if (level === 'MEDIUM') return 'REVIEW';
    return 'APPROVE';
  }

  /**
   * Calculate confidence in fraud detection
   */
  private calculateConfidence(flagCount: number, pattern: TransactionPattern): number {
    // Base confidence on amount of historical data
    const historyScore = Math.min(pattern.transactionFrequency * 10, 50);
    
    // Confidence increases with more specific flags
    const flagScore = Math.min(flagCount * 10, 50);

    return Math.round(historyScore + flagScore);
  }

  /**
   * Get most common items from array
   */
  private getMostCommon<T>(arr: T[], count: number): T[] {
    const frequency = new Map<T, number>();
    arr.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([item]) => item);
  }
}

export const mlFraudDetectionService = new MLFraudDetectionService();
