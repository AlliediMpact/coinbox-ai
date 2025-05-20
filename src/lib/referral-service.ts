import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc, 
  Timestamp,
  setDoc,
  deleteDoc,
  arrayUnion
} from 'firebase/firestore';
import { membershipService } from './membership-service';
import { notificationService } from './notification-service';
import { commissionService } from './commission-service';

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

  /**
   * Create a unique referral code for a user
   */
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

  /**
   * Generate a unique alphanumeric referral code
   */
  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < this.REFERRAL_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get the active referral code for a user
   */
  async getUserReferralCode(userId: string): Promise<string | null> {
    try {
      const codesRef = collection(db, 'referral_codes');
      const q = query(codesRef, where('userId', '==', userId), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : snapshot.docs[0].data().code;
    } catch (error) {
      console.error('Error getting user referral code:', error);
      return null;
    }
  }

  /**
   * Process a referral when a new user signs up with a referral code
   */
  async processReferral(referralCode: string, newUserId: string): Promise<void> {
    try {
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

      const referralDoc = await addDoc(collection(db, 'referrals'), referral);

      // Add referral to user's record
      const userRef = doc(db, 'users', newUserId);
      await updateDoc(userRef, {
        referrerId,
        referralCode,
        referralDate: Timestamp.now()
      });

      // Update referrer's stats
      await this.updateReferrerStats(referrerId, newUserId);

      // Notify referrer
      await notificationService.createNotification({
        userId: referrerId,
        type: 'referral',
        title: 'New Referral',
        message: 'Someone has signed up using your referral code!',
        priority: 'normal',
        data: {
          referralId: referralDoc.id
        }
      });
    } catch (error) {
      console.error('Error processing referral:', error);
      throw error;
    }
  }

  /**
   * Update referrer's statistics with a new referral
   */
  private async updateReferrerStats(referrerId: string, referredUserId: string): Promise<void> {
    try {
      const statsRef = doc(db, 'referralStats', referrerId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        // Update existing stats
        const currentStats = statsDoc.data();
        const now = new Date();
        const isCurrentMonth = currentStats.lastUpdated && 
          new Date(currentStats.lastUpdated.toDate()).getMonth() === now.getMonth() &&
          new Date(currentStats.lastUpdated.toDate()).getFullYear() === now.getFullYear();
        
        await updateDoc(statsRef, {
          totalReferrals: (currentStats.totalReferrals || 0) + 1,
          monthlyReferrals: isCurrentMonth 
            ? (currentStats.monthlyReferrals || 0) + 1 
            : 1,
          lastUpdated: Timestamp.now()
        });
      } else {
        // Create new stats record
        await setDoc(statsRef, {
          userId: referrerId,
          totalReferrals: 1,
          activeReferrals: 0,
          totalCommissions: 0,
          pendingCommissions: 0,
          totalVolume: 0,
          monthlyReferrals: 1,
          lastUpdated: Timestamp.now()
        });
      }
      
      // Add to referrals list in the user document
      const userRef = doc(db, 'users', referrerId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          referrals: arrayUnion({
            userId: referredUserId,
            date: Timestamp.now(),
            status: 'pending'
          })
        });
      }
    } catch (error) {
      console.error('Error updating referrer stats:', error);
    }
  }

  /**
   * Complete a referral when the referred user meets the criteria
   */
  async completeReferral(referredUserId: string): Promise<void> {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referredUserId', '==', referredUserId), where('status', '==', 'pending'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const referral = snapshot.docs[0];
        const referralData = referral.data();
        
        await updateDoc(doc(db, 'referrals', referral.id), {
          status: 'completed',
          completedAt: Timestamp.now()
        });

        // Update referrer's stats
        const statsRef = doc(db, 'referralStats', referralData.referrerId);
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          await updateDoc(statsRef, {
            activeReferrals: (statsDoc.data().activeReferrals || 0) + 1,
            lastUpdated: Timestamp.now()
          });
        }

        // Update user's referrals list
        const userRef = doc(db, 'users', referralData.referrerId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const referrals = userDoc.data().referrals || [];
          const updatedReferrals = referrals.map((ref: any) => {
            if (ref.userId === referredUserId) {
              return { ...ref, status: 'completed' };
            }
            return ref;
          });
          
          await updateDoc(userRef, { referrals: updatedReferrals });
        }

        // Check and update membership tier based on new active referral
        await membershipService.checkAndUpdateTier(referralData.referrerId);
        
        // Notify referrer
        await notificationService.createNotification({
          userId: referralData.referrerId,
          type: 'referral',
          title: 'Referral Completed',
          message: 'One of your referrals has been activated! You can now earn commissions from their activity.',
          priority: 'normal',
          data: {
            referralId: referral.id
          }
        });
      }
    } catch (error) {
      console.error('Error completing referral:', error);
    }
  }

  /**
   * Process commission for a transaction made by a referred user
   */
  async processReferralCommission(trade: any): Promise<void> {
    try {
      const referral = await this.getActiveReferral(trade.userId);
      if (!referral || !this.isEligibleForCommission(referral)) return;

      // Use commission service to process the commission
      await commissionService.processReferralCommission(
        referral.referrerId,
        trade.userId,
        trade.amount,
        trade.type,
        trade.id
      );

      // Update referral stats
      await updateDoc(doc(db, 'referrals', referral.id), {
        commissionsPaid: referral.commissionsPaid + (trade.amount * (await membershipService.getReferralCommissionRate(referral.referrerId))),
        totalTradeVolume: referral.totalTradeVolume + trade.amount
      });
    } catch (error) {
      console.error('Error processing referral commission:', error);
    }
  }

  /**
   * Get active referral relationship for a user
   */
  private async getActiveReferral(userId: string): Promise<Referral | null> {
    try {
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, 
        where('referredUserId', '==', userId),
        where('status', '==', 'completed')
      );
      const snapshot = await getDocs(q);
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Referral;
    } catch (error) {
      console.error('Error getting active referral:', error);
      return null;
    }
  }

  /**
   * Check if a referral is still eligible for commission
   */
  private isEligibleForCommission(referral: Referral): boolean {
    if (!referral.completedAt) return false;
    
    const expiryDate = new Date(referral.completedAt.toDate());
    expiryDate.setMonth(expiryDate.getMonth() + this.COMMISSION_EXPIRY_MONTHS);
    
    return new Date() <= expiryDate;
  }

  /**
   * Get referral statistics for a user
   */
  async getReferralStats(userId: string) {
    try {
      return await commissionService.getReferralStats(userId);
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return null;
    }
  }

  /**
   * Deactivate a referral code
   */
  async deactivateReferralCode(userId: string, codeId: string): Promise<boolean> {
    try {
      const codeRef = doc(db, 'referral_codes', codeId);
      const codeDoc = await getDoc(codeRef);
      
      if (!codeDoc.exists() || codeDoc.data().userId !== userId) {
        return false;
      }
      
      await updateDoc(codeRef, { isActive: false });
      return true;
    } catch (error) {
      console.error('Error deactivating referral code:', error);
      return false;
    }
  }

  /**
   * Get all referral codes for a user
   */
  async getAllReferralCodes(userId: string): Promise<any[]> {
    try {
      const codesRef = collection(db, 'referral_codes');
      const q = query(codesRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all referral codes:', error);
      return [];
    }
  }

  /**
   * Get referrals made by a user
   */
  async getUserReferrals(userId: string): Promise<any[]> {
    try {
      return await commissionService.getActiveReferrals(userId);
    } catch (error) {
      console.error('Error getting user referrals:', error);
      return [];
    }
  }
}

export const referralService = new ReferralService();