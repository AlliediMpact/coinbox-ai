import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { getTierConfig, MembershipTierType } from './membership-tiers';

interface CommissionResult {
    success: boolean;
    message: string;
    data?: any;
}

export class CommissionService {
    private db = getFirestore();

    async calculateReferralBonus(
        referrerId: string,
        referredUserId: string,
        membershipTier: MembershipTierType
    ): Promise<number> {
        const tierConfig = getTierConfig(membershipTier);
        const securityFee = tierConfig.securityFee;
        return (securityFee * tierConfig.commissionRate) / 100;
    }

    async processReferralCommission(
        referrerId: string,
        referredUserId: string,
        membershipTier: MembershipTierType
    ): Promise<CommissionResult> {
        try {
            const commissionAmount = await this.calculateReferralBonus(
                referrerId,
                referredUserId,
                membershipTier
            );

            await runTransaction(this.db, async (transaction) => {
                // Get referrer's current stats
                const referrerStatsRef = doc(this.db, 'referralStats', referrerId);
                const referrerStatsDoc = await transaction.get(referrerStatsRef);
                const currentStats = referrerStatsDoc.exists() ? referrerStatsDoc.data() : {
                    totalReferrals: 0,
                    totalCommissions: 0,
                    activeReferrals: 0,
                    monthlyReferrals: 0,
                    lastUpdated: new Date()
                };

                // Create commission record
                const commissionRef = doc(this.db, 'commissions', `comm_${Date.now()}_${referrerId}`);
                transaction.set(commissionRef, {
                    referrerId,
                    referredUserId,
                    amount: commissionAmount,
                    membershipTier,
                    status: 'pending',
                    createdAt: new Date(),
                    paymentDate: null
                });

                // Update referrer's stats
                transaction.set(referrerStatsRef, {
                    totalReferrals: currentStats.totalReferrals + 1,
                    totalCommissions: currentStats.totalCommissions + commissionAmount,
                    activeReferrals: currentStats.activeReferrals + 1,
                    monthlyReferrals: this.isCurrentMonth(currentStats.lastUpdated) 
                        ? currentStats.monthlyReferrals + 1 
                        : 1,
                    lastUpdated: new Date()
                });

                // Check for bonus eligibility
                await this.checkAndProcessBonus(transaction, referrerId, currentStats);
            });

            return {
                success: true,
                message: `Commission of R${commissionAmount} has been processed`,
                data: { commissionAmount }
            };

        } catch (error: any) {
            return {
                success: false,
                message: `Failed to process commission: ${error.message}`
            };
        }
    }

    private async checkAndProcessBonus(
        transaction: any,
        referrerId: string,
        stats: any
    ) {
        // Monthly performance bonus thresholds
        const MONTHLY_REFERRAL_BONUS = {
            TIER1: { count: 5, bonus: 500 },
            TIER2: { count: 10, bonus: 1200 },
            TIER3: { count: 20, bonus: 3000 }
        };

        if (!this.isCurrentMonth(stats.lastUpdated)) {
            return; // Skip if stats are not from current month
        }

        let bonusAmount = 0;
        if (stats.monthlyReferrals >= MONTHLY_REFERRAL_BONUS.TIER3.count) {
            bonusAmount = MONTHLY_REFERRAL_BONUS.TIER3.bonus;
        } else if (stats.monthlyReferrals >= MONTHLY_REFERRAL_BONUS.TIER2.count) {
            bonusAmount = MONTHLY_REFERRAL_BONUS.TIER2.bonus;
        } else if (stats.monthlyReferrals >= MONTHLY_REFERRAL_BONUS.TIER1.count) {
            bonusAmount = MONTHLY_REFERRAL_BONUS.TIER1.bonus;
        }

        if (bonusAmount > 0) {
            const bonusRef = doc(this.db, 'bonuses', `bonus_${Date.now()}_${referrerId}`);
            transaction.set(bonusRef, {
                referrerId,
                amount: bonusAmount,
                type: 'monthly_performance',
                status: 'pending',
                createdAt: new Date(),
                paymentDate: null,
                referralCount: stats.monthlyReferrals
            });
        }
    }

    async getCommissionHistory(userId: string): Promise<any[]> {
        try {
            const commissionsRef = collection(this.db, 'commissions');
            const q = query(
                commissionsRef,
                where('referrerId', '==', userId),
                where('status', 'in', ['pending', 'paid'])
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error fetching commission history:', error);
            return [];
        }
    }

    async getReferralStats(userId: string): Promise<any> {
        try {
            const statsDoc = await getDoc(doc(this.db, 'referralStats', userId));
            return statsDoc.exists() ? statsDoc.data() : null;
        } catch (error) {
            console.error('Error fetching referral stats:', error);
            return null;
        }
    }

    async getActiveReferrals(userId: string): Promise<any[]> {
        try {
            const usersRef = collection(this.db, 'users');
            const q = query(
                usersRef,
                where('referrerId', '==', userId),
                where('status', '==', 'active')
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (error) {
            console.error('Error fetching active referrals:', error);
            return [];
        }
    }

    private isCurrentMonth(date: Date): boolean {
        const now = new Date();
        const compareDate = new Date(date);
        return now.getFullYear() === compareDate.getFullYear() &&
               now.getMonth() === compareDate.getMonth();
    }

    async withdrawCommissions(userId: string): Promise<CommissionResult> {
        try {
            let totalAmount = 0;

            await runTransaction(this.db, async (transaction) => {
                // Get all pending commissions
                const commissionsRef = collection(this.db, 'commissions');
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
                    totalAmount += commissionData.amount;

                    transaction.update(commission.ref, {
                        status: 'paid',
                        paymentDate: new Date()
                    });
                }

                // Update user's wallet
                const userWalletRef = doc(this.db, 'wallets', userId);
                const walletDoc = await transaction.get(userWalletRef);
                
                if (!walletDoc.exists()) {
                    throw new Error('User wallet not found');
                }

                const currentBalance = walletDoc.data().balance || 0;
                transaction.update(userWalletRef, {
                    balance: currentBalance + totalAmount
                });
            });

            return {
                success: true,
                message: `Successfully withdrawn R${totalAmount} in commissions`,
                data: { amount: totalAmount }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}