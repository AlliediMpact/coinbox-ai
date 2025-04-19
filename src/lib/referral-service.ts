import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { membershipService } from './membership-service';
import { notificationService } from './notification-service';
import { transactionService } from './transaction-service';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  commissionsPaid: number;
  totalTradeVolume: number;
}

class ReferralService {
  private readonly REFERRAL_CODE_LENGTH = 8;
  private readonly COMMISSION_EXPIRY_MONTHS = 12;

  async createReferralCode(userId: string): Promise<string> {
    const existingCode = await this.getUserReferralCode(userId);
    if (existingCode) return existingCode;

    const code = this.generateUniqueCode();
    await addDoc(collection(db, 'referral_codes'), {
      userId,
      code,
      createdAt: Timestamp.now(),
      isActive: true
    });

    return code;
  }

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < this.REFERRAL_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getUserReferralCode(userId: string): Promise<string | null> {
    const codesRef = collection(db, 'referral_codes');
    const q = query(codesRef, where('userId', '==', userId), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0].data().code;
  }

  async processReferral(referralCode: string, newUserId: string): Promise<void> {
    const codesRef = collection(db, 'referral_codes');
    const q = query(codesRef, where('code', '==', referralCode), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Invalid referral code');
    }

    const referrerData = snapshot.docs[0].data();
    const referrerId = referrerData.userId;

    if (referrerId === newUserId) {
      throw new Error('Cannot refer yourself');
    }

    // Create referral record
    const referral: Omit<Referral, 'id'> = {
      referrerId,
      referredUserId: newUserId,
      referralCode,
      status: 'pending',
      createdAt: Timestamp.now(),
      commissionsPaid: 0,
      totalTradeVolume: 0
    };

    await addDoc(collection(db, 'referrals'), referral);

    // Notify referrer
    await notificationService.createNotification({
      userId: referrerId,
      type: 'referral',
      title: 'New Referral',
      message: 'Someone has signed up using your referral code!',
      priority: 'normal'
    });
  }

  async completeReferral(referredUserId: string): Promise<void> {
    const referralsRef = collection(db, 'referrals');
    const q = query(referralsRef, where('referredUserId', '==', referredUserId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const referral = snapshot.docs[0];
      await updateDoc(doc(db, 'referrals', referral.id), {
        status: 'completed',
        completedAt: Timestamp.now()
      });

      // Update referrer's metrics
      await membershipService.checkAndUpdateTier(referral.data().referrerId);
    }
  }

  async processReferralCommission(trade: any): Promise<void> {
    const referral = await this.getActiveReferral(trade.userId);
    if (!referral || !this.isEligibleForCommission(referral)) return;

    const commissionRate = await membershipService.getReferralCommissionRate(referral.referrerId);
    const commissionAmount = trade.amount * commissionRate;

    if (commissionAmount > 0) {
      // Create commission transaction
      await transactionService.createTransaction({
        userId: referral.referrerId,
        type: 'commission',
        amount: commissionAmount,
        status: 'completed',
        metadata: {
          referralId: referral.id,
          tradeId: trade.id
        }
      });

      // Update referral stats
      await updateDoc(doc(db, 'referrals', referral.id), {
        commissionsPaid: referral.commissionsPaid + commissionAmount,
        totalTradeVolume: referral.totalTradeVolume + trade.amount
      });

      // Notify referrer
      await notificationService.createNotification({
        userId: referral.referrerId,
        type: 'commission',
        title: 'Referral Commission Earned',
        message: `You earned R${commissionAmount.toFixed(2)} in referral commission!`,
        priority: 'normal'
      });
    }
  }

  private async getActiveReferral(userId: string): Promise<Referral | null> {
    const referralsRef = collection(db, 'referrals');
    const q = query(referralsRef, 
      where('referredUserId', '==', userId),
      where('status', '==', 'completed')
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Referral;
  }

  private isEligibleForCommission(referral: Referral): boolean {
    if (!referral.completedAt) return false;
    
    const expiryDate = new Date(referral.completedAt.toDate());
    expiryDate.setMonth(expiryDate.getMonth() + this.COMMISSION_EXPIRY_MONTHS);
    
    return new Date() <= expiryDate;
  }

  async getReferralStats(userId: string) {
    const referralsRef = collection(db, 'referrals');
    const q = query(referralsRef, where('referrerId', '==', userId));
    const snapshot = await getDocs(q);

    const stats = {
      totalReferrals: 0,
      activeReferrals: 0,
      totalCommissions: 0,
      totalVolume: 0
    };

    snapshot.docs.forEach(doc => {
      const referral = doc.data() as Referral;
      stats.totalReferrals++;
      if (referral.status === 'completed') {
        stats.activeReferrals++;
        stats.totalCommissions += referral.commissionsPaid;
        stats.totalVolume += referral.totalTradeVolume;
      }
    });

    return stats;
  }
}

export const referralService = new ReferralService();