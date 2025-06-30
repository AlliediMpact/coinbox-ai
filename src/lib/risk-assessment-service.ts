import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { membershipService } from './membership-service';

export interface RiskFactors {
  creditScore: number;
  accountAge: number; // in days
  transactionHistory: number;
  defaultHistory: number;
  membershipTier: string;
  averageTransactionAmount: number;
  frequencyScore: number;
  diversificationScore: number;
}

export interface LoanScoreResult {
  score: number; // 0-1000
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  recommendation: 'approve' | 'review' | 'reject';
  maxLoanAmount: number;
  interestRateModifier: number; // percentage to add/subtract from base rate
  explanation: string[];
  factors: RiskFactors;
}

export interface CreditEvent {
  userId: string;
  type: 'loan_repaid' | 'loan_defaulted' | 'payment_late' | 'payment_on_time';
  amount: number;
  timestamp: Date;
  daysLate?: number;
}

class RiskAssessmentService {
  
  // Calculate comprehensive loan score for a user
  async calculateLoanScore(userId: string, requestedAmount: number): Promise<LoanScoreResult> {
    try {
      const factors = await this.gatherRiskFactors(userId);
      const score = this.computeRiskScore(factors, requestedAmount);
      
      return this.generateLoanRecommendation(score, factors, requestedAmount);
    } catch (error) {
      console.error('Error calculating loan score:', error);
      throw new Error('Risk assessment failed');
    }
  }

  // Gather all risk factors for a user
  private async gatherRiskFactors(userId: string): Promise<RiskFactors> {
    const [
      membership,
      transactionHistory,
      creditHistory,
      accountInfo
    ] = await Promise.all([
      this.getUserMembership(userId),
      this.getTransactionHistory(userId),
      this.getCreditHistory(userId),
      this.getAccountInfo(userId)
    ]);

    const accountAge = this.calculateAccountAge(accountInfo.createdAt);
    const transactionCount = transactionHistory.length;
    const averageAmount = this.calculateAverageTransactionAmount(transactionHistory);
    const frequencyScore = this.calculateFrequencyScore(transactionHistory);
    const diversificationScore = this.calculateDiversificationScore(transactionHistory);
    const defaultHistory = this.calculateDefaultRate(creditHistory);
    const creditScore = this.calculateCreditScore(creditHistory, transactionHistory);

    return {
      creditScore,
      accountAge,
      transactionHistory: transactionCount,
      defaultHistory,
      membershipTier: membership?.currentTier || 'Basic',
      averageTransactionAmount: averageAmount,
      frequencyScore,
      diversificationScore
    };
  }

  // Compute overall risk score (0-1000, higher is better)
  private computeRiskScore(factors: RiskFactors, requestedAmount: number): number {
    let score = 500; // Base score

    // Credit Score Factor (0-300 points)
    score += (factors.creditScore / 850) * 300;

    // Account Age Factor (0-100 points)
    const ageBonus = Math.min(factors.accountAge / 365, 2) * 50; // Max 2 years for full bonus
    score += ageBonus;

    // Transaction History Factor (0-100 points)
    const transactionBonus = Math.min(factors.transactionHistory / 50, 1) * 100;
    score += transactionBonus;

    // Membership Tier Factor (0-100 points)
    const tierBonus = this.getMembershipTierBonus(factors.membershipTier);
    score += tierBonus;

    // Default History Penalty (0 to -200 points)
    const defaultPenalty = factors.defaultHistory * 200;
    score -= defaultPenalty;

    // Frequency Score (0-50 points)
    score += factors.frequencyScore * 50;

    // Diversification Score (0-50 points)
    score += factors.diversificationScore * 50;

    // Amount vs Income Ratio Penalty
    const amountRatio = this.calculateAmountRatio(requestedAmount, factors);
    score -= amountRatio * 100;

    return Math.max(0, Math.min(1000, Math.round(score)));
  }

  // Generate loan recommendation based on score
  private generateLoanRecommendation(
    score: number, 
    factors: RiskFactors, 
    requestedAmount: number
  ): LoanScoreResult {
    let riskLevel: LoanScoreResult['riskLevel'];
    let recommendation: LoanScoreResult['recommendation'];
    let interestRateModifier = 0;
    let maxLoanAmount = 0;
    const explanation: string[] = [];

    // Determine risk level and recommendation
    if (score >= 800) {
      riskLevel = 'low';
      recommendation = 'approve';
      interestRateModifier = -2; // 2% discount
      maxLoanAmount = this.getMaxLoanForTier(factors.membershipTier);
      explanation.push('Excellent credit profile with low risk indicators');
    } else if (score >= 650) {
      riskLevel = 'medium';
      recommendation = 'approve';
      interestRateModifier = 0;
      maxLoanAmount = this.getMaxLoanForTier(factors.membershipTier) * 0.8;
      explanation.push('Good credit profile with acceptable risk');
    } else if (score >= 500) {
      riskLevel = 'high';
      recommendation = 'review';
      interestRateModifier = 3; // 3% premium
      maxLoanAmount = this.getMaxLoanForTier(factors.membershipTier) * 0.5;
      explanation.push('Elevated risk requires manual review');
    } else {
      riskLevel = 'very-high';
      recommendation = 'reject';
      interestRateModifier = 5; // 5% premium if approved
      maxLoanAmount = this.getMaxLoanForTier(factors.membershipTier) * 0.2;
      explanation.push('High risk profile requires careful consideration');
    }

    // Add specific factor explanations
    if (factors.accountAge < 30) {
      explanation.push('New account reduces reliability score');
    }
    if (factors.defaultHistory > 0.1) {
      explanation.push('Previous defaults increase risk assessment');
    }
    if (factors.transactionHistory < 5) {
      explanation.push('Limited transaction history affects scoring');
    }
    if (factors.creditScore > 750) {
      explanation.push('Strong credit score supports approval');
    }

    return {
      score,
      riskLevel,
      recommendation,
      maxLoanAmount,
      interestRateModifier,
      explanation,
      factors
    };
  }

  // Helper methods
  private async getUserMembership(userId: string) {
    return await membershipService.getUserMembership(userId);
  }

  private async getTransactionHistory(userId: string) {
    // In a real implementation, this would fetch from transactions collection
    // For now, returning mock data structure
    return [];
  }

  private async getCreditHistory(userId: string): Promise<CreditEvent[]> {
    // In a real implementation, this would fetch from credit_events collection
    return [];
  }

  private async getAccountInfo(userId: string) {
    // In a real implementation, this would fetch user account creation date
    return { createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }; // 90 days ago
  }

  private calculateAccountAge(createdAt: Date): number {
    return Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateAverageTransactionAmount(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    return total / transactions.length;
  }

  private calculateFrequencyScore(transactions: any[]): number {
    // Calculate transaction frequency score (0-1)
    if (transactions.length === 0) return 0;
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(tx => 
      new Date(tx.timestamp).getTime() > thirtyDaysAgo
    );
    
    return Math.min(recentTransactions.length / 10, 1); // Ideal: 10+ transactions per month
  }

  private calculateDiversificationScore(transactions: any[]): number {
    // Calculate diversity of transaction types and amounts (0-1)
    if (transactions.length === 0) return 0;
    
    const types = new Set(transactions.map(tx => tx.type));
    const amounts = transactions.map(tx => tx.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
    
    const typeScore = Math.min(types.size / 3, 1); // Ideal: 3+ transaction types
    const varianceScore = Math.min(variance / (avgAmount * avgAmount), 1);
    
    return (typeScore + varianceScore) / 2;
  }

  private calculateDefaultRate(creditHistory: CreditEvent[]): number {
    if (creditHistory.length === 0) return 0;
    
    const defaults = creditHistory.filter(event => event.type === 'loan_defaulted');
    return defaults.length / creditHistory.length;
  }

  private calculateCreditScore(creditHistory: CreditEvent[], transactionHistory: any[]): number {
    let score = 650; // Base score
    
    // Payment history (35% of score)
    const onTimePayments = creditHistory.filter(event => event.type === 'payment_on_time').length;
    const latePayments = creditHistory.filter(event => event.type === 'payment_late').length;
    const totalPayments = onTimePayments + latePayments;
    
    if (totalPayments > 0) {
      const onTimeRatio = onTimePayments / totalPayments;
      score += (onTimeRatio - 0.8) * 200; // Bonus/penalty based on 80% baseline
    }
    
    // Transaction volume (30% of score)
    const totalVolume = transactionHistory.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalVolume > 10000) score += 50;
    if (totalVolume > 50000) score += 50;
    
    // Account age (15% of score)
    const accountAge = this.calculateAccountAge(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    score += Math.min(accountAge / 365, 2) * 50;
    
    return Math.max(300, Math.min(850, Math.round(score)));
  }

  private getMembershipTierBonus(tier: string): number {
    const bonuses = {
      'Basic': 0,
      'Ambassador': 25,
      'VIP': 50,
      'Business': 75
    };
    return bonuses[tier as keyof typeof bonuses] || 0;
  }

  private getMaxLoanForTier(tier: string): number {
    const limits = {
      'Basic': 500,
      'Ambassador': 1000,
      'VIP': 5000,
      'Business': 10000
    };
    return limits[tier as keyof typeof limits] || 500;
  }

  private calculateAmountRatio(requestedAmount: number, factors: RiskFactors): number {
    const maxAllowed = this.getMaxLoanForTier(factors.membershipTier);
    if (requestedAmount <= maxAllowed * 0.5) return 0;
    if (requestedAmount <= maxAllowed * 0.8) return 0.2;
    return 0.5;
  }

  // Record credit events for future risk assessment
  async recordCreditEvent(event: Omit<CreditEvent, 'timestamp'>): Promise<void> {
    try {
      const creditEvent: CreditEvent = {
        ...event,
        timestamp: new Date()
      };
      
      // In a real implementation, save to credit_events collection
      console.log('Credit event recorded:', creditEvent);
    } catch (error) {
      console.error('Error recording credit event:', error);
    }
  }

  // Bulk risk assessment for admin dashboard
  async generateRiskReport(): Promise<{
    totalUsers: number;
    riskDistribution: Record<string, number>;
    averageScore: number;
    flaggedUsers: Array<{ userId: string; score: number; reason: string }>;
  }> {
    try {
      // In a real implementation, this would analyze all users
      // For now, returning mock data structure
      return {
        totalUsers: 245,
        riskDistribution: {
          'low': 89,
          'medium': 102,
          'high': 43,
          'very-high': 11
        },
        averageScore: 672,
        flaggedUsers: [
          { userId: 'user1', score: 320, reason: 'Multiple defaults in last 3 months' },
          { userId: 'user2', score: 420, reason: 'Suspicious transaction patterns' }
        ]
      };
    } catch (error) {
      console.error('Error generating risk report:', error);
      throw new Error('Risk report generation failed');
    }
  }
}

export const riskAssessmentService = new RiskAssessmentService();
