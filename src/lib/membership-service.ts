import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { transactionService } from './transaction-service';
import { notificationService } from './notification-service';

export interface MembershipTier {
  id: string;
  name: 'Basic' | 'Ambassador' | 'VIP' | 'Business';
  monthlyFee: number;
  benefits: {
    tradingFeeDiscount: number;
    maxDailyWithdrawal: number;
    supportPriority: 'normal' | 'high' | 'priority';
    referralCommission: number;
    customBenefits: string[];
  };
  requirements?: {
    minMonthlyVolume?: number;
    minReferrals?: number;
  };
}

export interface UserMembership {
  userId: string;
  currentTier: string;
  joinDate: Timestamp;
  renewalDate: Timestamp;
  paymentStatus: 'active' | 'pending' | 'overdue';
  metrics: {
    monthlyTradingVolume: number;
    totalReferrals: number;
    successfulReferrals: number;
  };
}

class MembershipService {
  private readonly MEMBERSHIP_TIERS: Record<string, MembershipTier> = {
    basic: {
      id: 'basic',
      name: 'Basic',
      monthlyFee: 0,
      benefits: {
        tradingFeeDiscount: 0,
        maxDailyWithdrawal: 5000,
        supportPriority: 'normal',
        referralCommission: 0.01,
        customBenefits: ['Basic trading features', 'Standard support']
      }
    },
    ambassador: {
      id: 'ambassador',
      name: 'Ambassador',
      monthlyFee: 199,
      benefits: {
        tradingFeeDiscount: 0.1,
        maxDailyWithdrawal: 10000,
        supportPriority: 'high',
        referralCommission: 0.02,
        customBenefits: [
          'Reduced trading fees',
          'Higher withdrawal limits',
          'Priority support',
          'Enhanced referral commissions'
        ]
      },
      requirements: {
        minReferrals: 5
      }
    },
    vip: {
      id: 'vip',
      name: 'VIP',
      monthlyFee: 499,
      benefits: {
        tradingFeeDiscount: 0.2,
        maxDailyWithdrawal: 25000,
        supportPriority: 'priority',
        referralCommission: 0.03,
        customBenefits: [
          'VIP trading features',
          'Highest priority support',
          'Premium referral commissions',
          'Exclusive market insights',
          'One-on-one trading consultations'
        ]
      },
      requirements: {
        minMonthlyVolume: 100000,
        minReferrals: 10
      }
    },
    business: {
      id: 'business',
      name: 'Business',
      monthlyFee: 999,
      benefits: {
        tradingFeeDiscount: 0.3,
        maxDailyWithdrawal: 50000,
        supportPriority: 'priority',
        referralCommission: 0.05,
        customBenefits: [
          'Enterprise trading features',
          'Dedicated account manager',
          'Custom API access',
          'Bulk trading capabilities',
          'Advanced reporting tools',
          'Custom integration support'
        ]
      },
      requirements: {
        minMonthlyVolume: 250000,
        minReferrals: 25
      }
    }
  };

  async getUserMembership(userId: string): Promise<UserMembership | null> {
    const membershipRef = doc(db, 'user_memberships', userId);
    const membershipDoc = await getDoc(membershipRef);
    return membershipDoc.exists() ? membershipDoc.data() as UserMembership : null;
  }

  async upgradeMembership(userId: string, newTierId: string) {
    const tier = this.MEMBERSHIP_TIERS[newTierId];
    if (!tier) throw new Error('Invalid membership tier');

    const userMembership = await this.getUserMembership(userId);
    const now = Timestamp.now();

    if (!userMembership) {
      // Create new membership
      await this.createMembership(userId, newTierId);
    } else {
      // Validate requirements for upgrade
      await this.validateUpgradeRequirements(userId, newTierId);

      // Process upgrade payment
      const paymentResult = await transactionService.createTransaction({
        userId,
        type: 'fee',
        amount: tier.monthlyFee,
        status: 'pending',
        metadata: {
          description: `Membership upgrade to ${tier.name}`
        }
      });

      // Update membership
      await updateDoc(doc(db, 'user_memberships', userId), {
        currentTier: newTierId,
        renewalDate: Timestamp.fromDate(new Date(now.toDate().setMonth(now.toDate().getMonth() + 1))),
        paymentStatus: 'active',
        'metrics.lastUpdated': now
      });

      // Notify user
      await notificationService.createNotification({
        userId,
        type: 'system',
        title: 'Membership Upgraded',
        message: `Your membership has been upgraded to ${tier.name}. Enjoy your new benefits!`,
        priority: 'high',
        metadata: {
          action: 'view_membership'
        }
      });
    }
  }

  private async createMembership(userId: string, tierId: string) {
    const now = Timestamp.now();
    const membership: UserMembership = {
      userId,
      currentTier: tierId,
      joinDate: now,
      renewalDate: Timestamp.fromDate(new Date(now.toDate().setMonth(now.toDate().getMonth() + 1))),
      paymentStatus: 'active',
      metrics: {
        monthlyTradingVolume: 0,
        totalReferrals: 0,
        successfulReferrals: 0
      }
    };

    await setDoc(doc(db, 'user_memberships', userId), membership);
  }

  private async validateUpgradeRequirements(userId: string, newTierId: string) {
    const tier = this.MEMBERSHIP_TIERS[newTierId];
    if (!tier.requirements) return true;

    const userMetrics = await this.getUserMetrics(userId);
    
    if (tier.requirements.minMonthlyVolume && 
        userMetrics.monthlyTradingVolume < tier.requirements.minMonthlyVolume) {
      throw new Error(`Minimum monthly trading volume of R${tier.requirements.minMonthlyVolume} required`);
    }

    if (tier.requirements.minReferrals && 
        userMetrics.successfulReferrals < tier.requirements.minReferrals) {
      throw new Error(`Minimum of ${tier.requirements.minReferrals} successful referrals required`);
    }

    return true;
  }

  private async getUserMetrics(userId: string) {
    // Get monthly trading volume
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const trades = await getDocs(query(
      collection(db, 'trades'),
      where('userId', '==', userId),
      where('createdAt', '>=', monthAgo)
    ));

    const monthlyTradingVolume = trades.docs.reduce((sum, trade) => 
      sum + trade.data().amount, 0);

    // Get referral stats
    const referrals = await getDocs(query(
      collection(db, 'referrals'),
      where('referrerId', '==', userId)
    ));

    const successfulReferrals = referrals.docs.filter(ref => 
      ref.data().status === 'completed').length;

    return {
      monthlyTradingVolume,
      totalReferrals: referrals.size,
      successfulReferrals
    };
  }

  async checkAndUpdateTier(userId: string) {
    const userMembership = await this.getUserMembership(userId);
    if (!userMembership) return;

    const metrics = await this.getUserMetrics(userId);
    const currentTier = this.MEMBERSHIP_TIERS[userMembership.currentTier];

    // Find the highest tier the user qualifies for
    const qualifiedTier = Object.values(this.MEMBERSHIP_TIERS)
      .sort((a, b) => b.monthlyFee - a.monthlyFee)
      .find(tier => {
        if (!tier.requirements) return true;
        return (!tier.requirements.minMonthlyVolume || 
                metrics.monthlyTradingVolume >= tier.requirements.minMonthlyVolume) &&
               (!tier.requirements.minReferrals ||
                metrics.successfulReferrals >= tier.requirements.minReferrals);
      });

    if (qualifiedTier && qualifiedTier.id !== currentTier.id) {
      // Notify user of qualification for upgrade
      await notificationService.createNotification({
        userId,
        type: 'system',
        title: 'Membership Upgrade Available',
        message: `You now qualify for ${qualifiedTier.name} membership! Upgrade to access enhanced benefits.`,
        priority: 'high',
        metadata: {
          action: 'upgrade_membership'
        }
      });
    }

    // Update metrics
    await updateDoc(doc(db, 'user_memberships', userId), {
      metrics: {
        ...metrics,
        lastUpdated: Timestamp.now()
      }
    });
  }

  getTierBenefits(tierId: string): MembershipTier['benefits'] {
    return this.MEMBERSHIP_TIERS[tierId]?.benefits;
  }

  async getReferralCommissionRate(userId: string): Promise<number> {
    const membership = await this.getUserMembership(userId);
    if (!membership) return this.MEMBERSHIP_TIERS.basic.benefits.referralCommission;
    return this.MEMBERSHIP_TIERS[membership.currentTier].benefits.referralCommission;
  }
}

export const membershipService = new MembershipService();