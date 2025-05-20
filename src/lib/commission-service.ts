import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction,
  addDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { membershipService } from './membership-service';
import { notificationService } from './notification-service';

export interface Commission {
  id: string;
  referrerId: string;
  referredUserId: string;
  amount: number;
  membershipTier: string;
  status: 'pending' | 'processing' | 'paid' | 'declined';
  createdAt: Timestamp;
  paymentDate: Timestamp | null;
  transactionId?: string;
  notes?: string;
}

interface CommissionResult {
  success: boolean;
  message: string;
  data?: any;
}

class CommissionService {
  // Calculate referral bonus based on membership tiers
  async calculateReferralBonus(
    referrerId: string,
    referredUserId: string,
    transactionAmount: number
  ): Promise<number> {
    try {
      // Get referrer's membership tier
      const referrerMembership = await membershipService.getUserMembership(referrerId);
      if (!referrerMembership) return 0;
      
      // Get referred user's membership tier
      const referredMembership = await membershipService.getUserMembership(referredUserId);
      if (!referredMembership) return 0;
      
      // Get commission rate based on both tiers
      const commissionRate = await membershipService.getReferralCommissionRate(
        referrerId, 
        referredMembership.currentTier
      );
      
      // Calculate commission amount
      return (transactionAmount * commissionRate) / 100;
    } catch (error) {
      console.error('Error calculating referral bonus:', error);
      return 0;
    }
  }

  // Process commission for a transaction
  async processReferralCommission(
    referrerId: string,
    referredUserId: string,
    transactionAmount: number,
    transactionType: string,
    transactionId?: string
  ): Promise<CommissionResult> {
    try {
      // Calculate commission amount
      const commissionAmount = await this.calculateReferralBonus(
        referrerId,
        referredUserId,
        transactionAmount
      );

      if (commissionAmount <= 0) {
        return {
          success: false,
          message: 'No commission applicable for this transaction',
          data: { commissionAmount: 0 }
        };
      }

      // Create commission record
      const commission: Omit<Commission, 'id'> = {
        referrerId,
        referredUserId,
        amount: commissionAmount,
        membershipTier: (await membershipService.getUserMembership(referrerId))?.currentTier || 'basic',
        status: 'pending',
        createdAt: Timestamp.now(),
        paymentDate: null,
        transactionId,
        notes: `Commission from ${transactionType} transaction`
      };
      
      const commissionRef = await addDoc(collection(db, 'commissions'), commission);

      // Update referral stats
      await this.updateReferralStats(referrerId, commissionAmount, transactionAmount);
      
      // Notify the referrer
      await notificationService.createNotification({
        userId: referrerId,
        type: 'commission',
        title: 'New Commission Earned',
        message: `You earned R${commissionAmount.toFixed(2)} from your referral's ${transactionType} transaction.`,
        priority: 'normal',
        data: { commissionId: commissionRef.id }
      });

      return {
        success: true,
        message: `Commission of R${commissionAmount.toFixed(2)} has been processed`,
        data: { 
          commissionAmount,
          commissionId: commissionRef.id
        }
      };
    } catch (error: any) {
      console.error('Error processing commission:', error);
      return {
        success: false,
        message: `Failed to process commission: ${error.message}`,
        data: { error: error.message }
      };
    }
  }

  // Update referral statistics for a user
  private async updateReferralStats(referrerId: string, commissionAmount: number, transactionAmount: number): Promise<void> {
    try {
      const statsRef = doc(db, 'referralStats', referrerId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        // Update existing stats
        await updateDoc(statsRef, {
          totalCommissions: (statsDoc.data().totalCommissions || 0) + commissionAmount,
          pendingCommissions: (statsDoc.data().pendingCommissions || 0) + commissionAmount,
          totalVolume: (statsDoc.data().totalVolume || 0) + transactionAmount,
          lastUpdated: Timestamp.now()
        });
      } else {
        // Create new stats record
        await runTransaction(db, async (transaction) => {
          transaction.set(statsRef, {
            userId: referrerId,
            totalReferrals: 0, // This will be calculated separately
            activeReferrals: 0, // This will be calculated separately
            totalCommissions: commissionAmount,
            pendingCommissions: commissionAmount,
            totalVolume: transactionAmount,
            monthlyReferrals: 0, // This will be calculated separately
            lastUpdated: Timestamp.now()
          });
        });
      }
      
      // Check for tier upgrade eligibility
      await membershipService.checkAndUpdateTier(referrerId);
    } catch (error) {
      console.error('Error updating referral stats:', error);
    }
  }

  // Get commission history for a user
  async getCommissionHistory(userId: string): Promise<Commission[]> {
    try {
      const commissionsRef = collection(db, 'commissions');
      const q = query(
        commissionsRef,
        where('referrerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];
    } catch (error) {
      console.error('Error fetching commission history:', error);
      return [];
    }
  }

  // Get referral statistics for a user
  async getReferralStats(userId: string): Promise<any> {
    try {
      const statsRef = doc(db, 'referralStats', userId);
      const statsDoc = await getDoc(statsRef);
      
      if (!statsDoc.exists()) {
        // Return default stats if none exist
        return {
          userId,
          totalReferrals: 0,
          activeReferrals: 0,
          totalCommissions: 0,
          pendingCommissions: 0,
          totalVolume: 0,
          lastUpdated: Timestamp.now()
        };
      }
      
      // Get count of referrals
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', userId)
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      
      // Get count of active referrals
      const activeReferralsQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', userId),
        where('status', '==', 'completed')
      );
      const activeReferralsSnapshot = await getDocs(activeReferralsQuery);
      
      // Update the stats with the latest counts
      const stats = statsDoc.data();
      stats.totalReferrals = referralsSnapshot.size;
      stats.activeReferrals = activeReferralsSnapshot.size;
      
      // Calculate pending commissions
      const pendingCommissionsQuery = query(
        collection(db, 'commissions'),
        where('referrerId', '==', userId),
        where('status', '==', 'pending')
      );
      const pendingCommissionsSnapshot = await getDocs(pendingCommissionsQuery);
      
      stats.pendingCommissions = pendingCommissionsSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().amount || 0), 0
      );
      
      // Return the complete stats
      return stats;
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      return null;
    }
  }

  // Get active referrals for a user
  async getActiveReferrals(userId: string): Promise<any[]> {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(
        referralsRef,
        where('referrerId', '==', userId),
        where('status', '==', 'completed')
      );

      const referralsSnapshot = await getDocs(q);
      const referrals = [];
      
      for (const referralDoc of referralsSnapshot.docs) {
        const referral = referralDoc.data();
        
        // Get user details for each referral
        const userDoc = await getDoc(doc(db, 'users', referral.referredUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Get membership tier
          const membership = await membershipService.getUserMembership(referral.referredUserId);
          
          // Calculate total commissions earned from this referral
          const commissionsQuery = query(
            collection(db, 'commissions'),
            where('referrerId', '==', userId),
            where('referredUserId', '==', referral.referredUserId)
          );
          const commissionsSnapshot = await getDocs(commissionsQuery);
          const commissionsEarned = commissionsSnapshot.docs.reduce(
            (sum, doc) => sum + (doc.data().amount || 0), 0
          );
          
          referrals.push({
            id: referralDoc.id,
            ...referral,
            displayName: userData.displayName || 'User',
            email: userData.email || 'No email',
            photoURL: userData.photoURL || null,
            tier: membership?.currentTier || 'basic',
            commissionsEarned,
            status: 'active'
          });
        }
      }
      
      return referrals;
    } catch (error) {
      console.error('Error fetching active referrals:', error);
      return [];
    }
  }

  // Process withdrawal of commissions
  async withdrawCommissions(userId: string): Promise<CommissionResult> {
    try {
      let totalAmount = 0;

      await runTransaction(db, async (transaction) => {
        // Get all pending commissions
        const commissionsRef = collection(db, 'commissions');
        const q = query(
          commissionsRef,
          where('referrerId', '==', userId),
          where('status', '==', 'pending')
        );

        const querySnapshot = await getDocs(q);
        const commissions = querySnapshot.docs;
        
        if (commissions.length === 0) {
          throw new Error('No pending commissions to withdraw');
        }

        // Calculate total amount and update commission statuses
        for (const commission of commissions) {
          const commissionData = commission.data();
          totalAmount += commissionData.amount || 0;

          transaction.update(commission.ref, {
            status: 'paid',
            paymentDate: Timestamp.now()
          });
        }

        // Update referral stats
        const statsRef = doc(db, 'referralStats', userId);
        const statsDoc = await transaction.get(statsRef);
        
        if (statsDoc.exists()) {
          transaction.update(statsRef, {
            pendingCommissions: 0,
            lastUpdated: Timestamp.now()
          });
        }

        // Update user's wallet
        const walletRef = doc(db, 'wallets', userId);
        const walletDoc = await transaction.get(walletRef);
        
        if (!walletDoc.exists()) {
          throw new Error('User wallet not found');
        }

        const currentBalance = walletDoc.data().balance || 0;
        transaction.update(walletRef, {
          balance: currentBalance + totalAmount
        });
        
        // Create transaction record
        const transactionRef = collection(db, 'transactions');
        transaction.set(doc(transactionRef), {
          userId,
          type: 'commission_withdrawal',
          amount: totalAmount,
          status: 'completed',
          description: `Withdrawal of R${totalAmount.toFixed(2)} in referral commissions`,
          timestamp: Timestamp.now(),
          metadata: {
            commissionCount: commissions.length
          }
        });
      });

      // Notify user of successful withdrawal
      await notificationService.createNotification({
        userId,
        type: 'transaction',
        title: 'Commission Withdrawal Successful',
        message: `R${totalAmount.toFixed(2)} has been added to your wallet.`,
        priority: 'high'
      });

      return {
        success: true,
        message: `Successfully withdrawn R${totalAmount.toFixed(2)} in commissions`,
        data: { amount: totalAmount }
      };
    } catch (error: any) {
      console.error('Error withdrawing commissions:', error);
      return {
        success: false,
        message: error.message || 'Failed to process withdrawal'
      };
    }
  }

  // Get monthly performance bonus eligibility
  async getMonthlyBonusEligibility(userId: string): Promise<any> {
    try {
      const statsRef = doc(db, 'referralStats', userId);
      const statsDoc = await getDoc(statsRef);
      
      if (!statsDoc.exists()) {
        return { eligible: false };
      }
      
      const stats = statsDoc.data();
      
      // Check if last update was in the current month
      const lastUpdated = stats.lastUpdated?.toDate() || new Date();
      const now = new Date();
      const isCurrentMonth = lastUpdated.getMonth() === now.getMonth() && 
                            lastUpdated.getFullYear() === now.getFullYear();
      
      if (!isCurrentMonth) {
        return { eligible: false };
      }
      
      // Monthly referral bonus thresholds
      const MONTHLY_REFERRAL_BONUS = {
        TIER1: { count: 5, bonus: 500 },
        TIER2: { count: 10, bonus: 1200 },
        TIER3: { count: 20, bonus: 3000 }
      };
      
      // Determine which bonus tier they qualify for
      let bonusTier = null;
      let bonusAmount = 0;
      
      if (stats.monthlyReferrals >= MONTHLY_REFERRAL_BONUS.TIER3.count) {
        bonusTier = 'TIER3';
        bonusAmount = MONTHLY_REFERRAL_BONUS.TIER3.bonus;
      } else if (stats.monthlyReferrals >= MONTHLY_REFERRAL_BONUS.TIER2.count) {
        bonusTier = 'TIER2';
        bonusAmount = MONTHLY_REFERRAL_BONUS.TIER2.bonus;
      } else if (stats.monthlyReferrals >= MONTHLY_REFERRAL_BONUS.TIER1.count) {
        bonusTier = 'TIER1';
        bonusAmount = MONTHLY_REFERRAL_BONUS.TIER1.bonus;
      }
      
      // Check if they've already received a bonus this month
      const bonusesRef = collection(db, 'bonuses');
      const q = query(
        bonusesRef,
        where('referrerId', '==', userId),
        where('type', '==', 'monthly_performance'),
        where('createdAt', '>=', new Date(now.getFullYear(), now.getMonth(), 1))
      );
      
      const bonusesSnapshot = await getDocs(q);
      const alreadyReceived = !bonusesSnapshot.empty;
      
      return {
        eligible: bonusTier !== null && !alreadyReceived,
        tier: bonusTier,
        amount: bonusAmount,
        currentCount: stats.monthlyReferrals || 0,
        nextTierThreshold: bonusTier === 'TIER1' ? MONTHLY_REFERRAL_BONUS.TIER2.count :
                          bonusTier === 'TIER2' ? MONTHLY_REFERRAL_BONUS.TIER3.count :
                          null
      };
    } catch (error) {
      console.error('Error checking bonus eligibility:', error);
      return { eligible: false };
    }
  }
}

export const commissionService = new CommissionService();