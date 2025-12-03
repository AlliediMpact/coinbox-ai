import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { membershipService } from './membership-service';
import { enhancedPaystackService } from './paystack-service-enhanced';
import { notificationService } from './basic-notification-service';

export interface Commission {
  id?: string;
  referrerId: string;
  referredUserId: string;
  transactionId: string;
  amount: number;
  commissionRate: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paymentReference?: string;
  createdAt: Date;
  paidAt?: Date;
  failureReason?: string;
  membershipTier: string;
  transactionType: 'membership' | 'trading' | 'loan_repayment';
}

export interface CommissionPayout {
  id?: string;
  referrerId: string;
  totalAmount: number;
  commissionCount: number;
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed';
  commissionIds: string[];
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface ReferralLeaderboard {
  userId: string;
  userName: string;
  email: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  monthlyCommissions: number;
  membershipTier: string;
  rank: number;
}

class CommissionAutomationService {
  
  // Calculate commission based on referral relationship and transaction
  async calculateCommission(
    transactionId: string,
    transactionAmount: number,
    transactionType: Commission['transactionType'],
    payerId: string
  ): Promise<Commission | null> {
    try {
      // Check if user was referred by someone
      const referralRelationship = await this.getReferralRelationship(payerId);
      
      if (!referralRelationship) {
        return null; // No referrer, no commission
      }

      // Get referrer's membership tier to determine commission rate
      const referrerMembership = await membershipService.getUserMembership(referralRelationship.referrerId);
      const commissionRate = this.getCommissionRate(referrerMembership?.currentTier || 'Basic', transactionType);
      
      if (commissionRate === 0) {
        return null; // No commission for this tier/transaction type
      }

      const commissionAmount = (transactionAmount * commissionRate) / 100;

      const commission: Omit<Commission, 'id'> = {
        referrerId: referralRelationship.referrerId,
        referredUserId: payerId,
        transactionId,
        amount: commissionAmount,
        commissionRate,
        status: 'pending',
        membershipTier: referrerMembership?.currentTier || 'Basic',
        transactionType,
        createdAt: new Date()
      };

      // Save commission record
      const commissionId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const commissionRef = doc(db, 'commissions', commissionId);
      await setDoc(commissionRef, commission);

      // Send notification to referrer
      await notificationService.sendNotification({
        userId: referralRelationship.referrerId,
        type: 'commission_earned',
        title: 'Commission Earned!',
        message: `You earned R${commissionAmount.toFixed(2)} commission from your referral.`,
        timestamp: new Date()
      });

      return { id: commissionId, ...commission };

    } catch (error) {
      console.error('Error calculating commission:', error);
      return null;
    }
  }

  // Get all pending commissions
  async getPendingCommissions(): Promise<Commission[]> {
    try {
      const pendingCommissionsQuery = query(
        collection(db, 'commissions'),
        where('status', '==', 'pending')
      );

      const pendingSnapshot = await getDocs(pendingCommissionsQuery);
      return pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];
    } catch (error) {
      console.error('Error getting pending commissions:', error);
      return [];
    }
  }

  // Process automated commission payouts (run daily)
  async processAutomatedPayouts(): Promise<void> {
    try {
      console.log('Starting automated commission payout process...');

      // Get all pending commissions older than 24 hours
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);

      const pendingCommissionsQuery = query(
        collection(db, 'commissions'),
        where('status', '==', 'pending'),
        where('createdAt', '<=', cutoffDate)
      );

      const pendingSnapshot = await getDocs(pendingCommissionsQuery);
      const pendingCommissions = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];

      if (pendingCommissions.length === 0) {
        console.log('No pending commissions found for payout');
        return;
      }

      // Group commissions by referrer
      const commissionsByReferrer = this.groupCommissionsByReferrer(pendingCommissions);

      // Process payouts for each referrer
      for (const [referrerId, commissions] of commissionsByReferrer.entries()) {
        await this.processReferrerPayout(referrerId, commissions);
      }

      console.log(`Processed payouts for ${commissionsByReferrer.size} referrers`);

    } catch (error) {
      console.error('Error in automated payout process:', error);
    }
  }

  private async processReferrerPayout(referrerId: string, commissions: Commission[]): Promise<void> {
    try {
      const totalAmount = commissions.reduce((sum, comm) => sum + comm.amount, 0);
      const minimumPayoutAmount = 100; // R100 minimum payout

      if (totalAmount < minimumPayoutAmount) {
        console.log(`Payout for ${referrerId} below minimum (R${totalAmount})`);
        return;
      }

      // Get referrer details
      const referrerDetails = await this.getReferrerDetails(referrerId);
      if (!referrerDetails) {
        console.error(`Referrer details not found for ${referrerId}`);
        return;
      }

      // Create payout record
      const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const payout: Omit<CommissionPayout, 'id'> = {
        referrerId,
        totalAmount,
        commissionCount: commissions.length,
        paymentReference: '', // Will be set after payment initialization
        status: 'pending',
        commissionIds: commissions.map(c => c.id!),
        createdAt: new Date()
      };

      // Save payout record
      const payoutRef = doc(db, 'commission_payouts', payoutId);
      await setDoc(payoutRef, payout);

      // For now, mark commissions as processing
      // In a real implementation, you would integrate with a payment gateway
      await this.updateCommissionStatus(commissions.map(c => c.id!), 'processing');

      // Send notification
      await notificationService.sendNotification({
        userId: referrerId,
        type: 'commission_payout_processing',
        title: 'Commission Payout Processing',
        message: `Your commission payout of R${totalAmount.toFixed(2)} is being processed.`,
        timestamp: new Date()
      });

      console.log(`Initiated payout for ${referrerId}: R${totalAmount}`);

    } catch (error) {
      console.error(`Error processing payout for ${referrerId}:`, error);
    }
  }

  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10): Promise<ReferralLeaderboard[]> {
    try {
      // Get all commissions for the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyCommissionsQuery = query(
        collection(db, 'commissions'),
        where('createdAt', '>=', startOfMonth),
        where('status', 'in', ['processing', 'paid'])
      );

      const commissionsSnapshot = await getDocs(monthlyCommissionsQuery);
      const commissions = commissionsSnapshot.docs.map(doc => doc.data()) as Commission[];

      // Get all time commissions
      const allTimeCommissionsQuery = query(
        collection(db, 'commissions'),
        where('status', 'in', ['processing', 'paid'])
      );

      const allTimeSnapshot = await getDocs(allTimeCommissionsQuery);
      const allTimeCommissions = allTimeSnapshot.docs.map(doc => doc.data()) as Commission[];

      // Aggregate data by referrer
      const leaderboardData = new Map<string, {
        monthlyCommissions: number;
        totalCommissions: number;
        totalReferrals: Set<string>;
        activeReferrals: Set<string>;
      }>();

      // Process monthly commissions
      commissions.forEach(comm => {
        if (!leaderboardData.has(comm.referrerId)) {
          leaderboardData.set(comm.referrerId, {
            monthlyCommissions: 0,
            totalCommissions: 0,
            totalReferrals: new Set(),
            activeReferrals: new Set()
          });
        }
        
        const data = leaderboardData.get(comm.referrerId)!;
        data.monthlyCommissions += comm.amount;
        data.activeReferrals.add(comm.referredUserId);
      });

      // Process all-time commissions
      allTimeCommissions.forEach(comm => {
        if (!leaderboardData.has(comm.referrerId)) {
          leaderboardData.set(comm.referrerId, {
            monthlyCommissions: 0,
            totalCommissions: 0,
            totalReferrals: new Set(),
            activeReferrals: new Set()
          });
        }
        
        const data = leaderboardData.get(comm.referrerId)!;
        data.totalCommissions += comm.amount;
        data.totalReferrals.add(comm.referredUserId);
      });

      // Convert to leaderboard format and get user details
      const leaderboard: ReferralLeaderboard[] = [];

      for (const [userId, data] of leaderboardData.entries()) {
        const userDetails = await this.getReferrerDetails(userId);
        if (userDetails) {
          leaderboard.push({
            userId,
            userName: userDetails.name,
            email: userDetails.email,
            totalReferrals: data.totalReferrals.size,
            activeReferrals: data.activeReferrals.size,
            totalCommissions: data.totalCommissions,
            monthlyCommissions: data.monthlyCommissions,
            membershipTier: userDetails.membershipTier,
            rank: 0 // Will be set after sorting
          });
        }
      }

      // Sort by monthly commissions and assign ranks
      leaderboard.sort((a, b) => b.monthlyCommissions - a.monthlyCommissions);
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard.slice(0, limit);

    } catch (error) {
      console.error('Error generating referral leaderboard:', error);
      return [];
    }
  }

  // Get commission dashboard data for a user
  async getCommissionDashboard(userId: string) {
    try {
      // Get user's commissions
      const commissionsQuery = query(
        collection(db, 'commissions'),
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const commissionsSnapshot = await getDocs(commissionsQuery);
      const commissions = commissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];

      // Calculate totals
      const totalCommissions = commissions.reduce((sum, comm) => sum + comm.amount, 0);
      const pendingCommissions = commissions
        .filter(comm => comm.status === 'pending')
        .reduce((sum, comm) => sum + comm.amount, 0);
      const paidCommissions = commissions
        .filter(comm => comm.status === 'paid')
        .reduce((sum, comm) => sum + comm.amount, 0);

      // Get monthly commissions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyCommissions = commissions
        .filter(comm => comm.createdAt >= startOfMonth)
        .reduce((sum, comm) => sum + comm.amount, 0);

      // Get recent payouts
      const payoutsQuery = query(
        collection(db, 'commission_payouts'),
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(5)
      );

      const payoutsSnapshot = await getDocs(payoutsQuery);
      const recentPayouts = payoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommissionPayout[];

      return {
        totalCommissions,
        pendingCommissions,
        paidCommissions,
        monthlyCommissions,
        commissionsCount: commissions.length,
        recentCommissions: commissions.slice(0, 10),
        recentPayouts
      };

    } catch (error) {
      console.error('Error getting commission dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private getCommissionRate(membershipTier: string, transactionType: Commission['transactionType']): number {
    const rates: Record<string, Record<string, number>> = {
      'Basic': { membership: 1, trading: 0.5, loan_repayment: 0.5 },
      'Ambassador': { membership: 2, trading: 1, loan_repayment: 1 },
      'VIP': { membership: 3, trading: 1.5, loan_repayment: 1.5 },
      'Business': { membership: 5, trading: 2, loan_repayment: 2 }
    };

    return rates[membershipTier]?.[transactionType] || 0;
  }

  private groupCommissionsByReferrer(commissions: Commission[]): Map<string, Commission[]> {
    const grouped = new Map<string, Commission[]>();
    
    commissions.forEach(commission => {
      if (!grouped.has(commission.referrerId)) {
        grouped.set(commission.referrerId, []);
      }
      grouped.get(commission.referrerId)!.push(commission);
    });

    return grouped;
  }

  private async getReferralRelationship(userId: string) {
    const query = `SELECT referrer_id FROM referrals WHERE referred_user_id = ?`;
    // This would be a database query in a real implementation
    // For now, return null
    return null;
  }

  private async getReferrerDetails(referrerId: string) {
    // This would fetch user details from your user database
    // For now, return mock data
    return {
      name: 'John Doe',
      email: 'john@example.com',
      membershipTier: 'Basic'
    };
  }

  private async updateCommissionStatus(commissionIds: string[], status: Commission['status']) {
    const updatePromises = commissionIds.map(id => {
      const commissionRef = doc(db, 'commissions', id);
      return setDoc(commissionRef, { status, updatedAt: new Date() }, { merge: true });
    });

    await Promise.all(updatePromises);
  }
}

export const commissionAutomationService = new CommissionAutomationService();
