import { 
    getFirestore, 
    doc as firestoreDoc,
    setDoc, 
    updateDoc, 
    getDoc,
    runTransaction as firestoreTransaction,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    DocumentReference,
    Timestamp
} from 'firebase/firestore';
import { getTierConfig, MembershipTierType } from './membership-tiers';
import { getRiskAssessment } from '@/ai/flows/risk-assessment-flow';
import { db } from './firebase';
import { paystackService } from './paystack-service';

interface TransactionResult {
    success: boolean;
    message: string;
    data?: any;
}

export interface Transaction {
  id?: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'commission' | 'escrow' | 'refund' | 'fee';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  metadata?: {
    tradeId?: string;
    referralId?: string;
    membershipTier?: string;
    commissionRate?: number;
    description?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class TransactionService {
    private db = getFirestore();

    async processLoan(
        userId: string,
        amount: number,
        membershipTier: MembershipTierType
    ): Promise<TransactionResult> {
        try {
            const tierConfig = getTierConfig(membershipTier);

            // Validate loan amount against tier limits
            if (amount > tierConfig.loanLimit) {
                return {
                    success: false,
                    message: `Loan amount exceeds your tier limit of R${tierConfig.loanLimit}`
                };
            }

            // Get user's risk assessment
            const riskAssessment = await getRiskAssessment({
                userId,
                tradeType: 'Borrow',
                tradeAmount: amount
            });

            if (riskAssessment.riskScore > 75) {
                return {
                    success: false,
                    message: 'Loan cannot be approved due to high risk score'
                };
            }

            // Calculate fees and amounts
            const repaymentAmount = amount * 1.25; // 25% repayment fee
            const borrowerWalletAmount = repaymentAmount * 0.05; // 5% to borrower wallet
            const lenderAmount = repaymentAmount - borrowerWalletAmount;
            const transactionFee = tierConfig.transactionFee;

            // Create escrow transaction
            await runTransaction(this.db, async (transaction) => {
                const escrowRef = doc(this.db, 'escrow', `loan_${Date.now()}_${userId}`);
                const userWalletRef = doc(this.db, 'wallets', userId);
                
                const walletSnap = await transaction.get(userWalletRef);
                if (!walletSnap.exists()) {
                    throw new Error('User wallet not found');
                }

                const currentBalance = walletSnap.data().balance || 0;
                
                // Create escrow record
                transaction.set(escrowRef, {
                    type: 'loan',
                    borrowerId: userId,
                    amount,
                    repaymentAmount,
                    borrowerWalletAmount,
                    lenderAmount,
                    transactionFee,
                    status: 'pending',
                    riskScore: riskAssessment.riskScore,
                    createdAt: new Date(),
                    membershipTier,
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                });

                // Update user's wallet with transaction fee deduction
                transaction.update(userWalletRef, {
                    balance: currentBalance - transactionFee
                });
            });

            return {
                success: true,
                message: 'Loan processed successfully and placed in escrow'
            };

        } catch (error: any) {
            return {
                success: false,
                message: `Transaction failed: ${error.message}`
            };
        }
    }

    async processInvestment(
        userId: string,
        amount: number,
        membershipTier: MembershipTierType
    ): Promise<TransactionResult> {
        try {
            const tierConfig = getTierConfig(membershipTier);

            // Validate investment amount
            if (amount > tierConfig.investmentLimit) {
                return {
                    success: false,
                    message: `Investment amount exceeds your tier limit of R${tierConfig.investmentLimit}`
                };
            }

            // Calculate returns and fees
            const monthlyReturn = amount * 0.20; // 20% monthly return
            const investorWalletAmount = monthlyReturn * 0.05; // 5% to investor wallet
            const bankAmount = monthlyReturn - investorWalletAmount;
            const transactionFee = tierConfig.transactionFee;

            // Create investment record with escrow
            await runTransaction(this.db, async (transaction) => {
                const investmentRef = doc(this.db, 'investments', `inv_${Date.now()}_${userId}`);
                const userWalletRef = doc(this.db, 'wallets', userId);
                
                const walletSnap = await transaction.get(userWalletRef);
                if (!walletSnap.exists()) {
                    throw new Error('User wallet not found');
                }

                const currentBalance = walletSnap.data().balance || 0;
                
                if (currentBalance < (amount + transactionFee)) {
                    throw new Error('Insufficient funds for investment and fees');
                }

                // Create investment record
                transaction.set(investmentRef, {
                    investorId: userId,
                    amount,
                    monthlyReturn,
                    investorWalletAmount,
                    bankAmount,
                    transactionFee,
                    status: 'active',
                    createdAt: new Date(),
                    membershipTier,
                    maturityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                });

                // Update user's wallet
                transaction.update(userWalletRef, {
                    balance: currentBalance - (amount + transactionFee)
                });
            });

            return {
                success: true,
                message: 'Investment processed successfully'
            };

        } catch (error: any) {
            return {
                success: false,
                message: `Investment failed: ${error.message}`
            };
        }
    }

    async processReferralCommission(
        referrerId: string,
        referredUserId: string,
        membershipTier: MembershipTierType
    ): Promise<TransactionResult> {
        try {
            const tierConfig = getTierConfig(membershipTier);
            const commissionRate = tierConfig.commissionRate;
            const securityFee = tierConfig.securityFee;
            
            // Calculate commission amount
            const commissionAmount = (securityFee * commissionRate) / 100;

            await runTransaction(this.db, async (transaction) => {
                const referrerWalletRef = doc(this.db, 'wallets', referrerId);
                const commissionRef = doc(this.db, 'commissions', `comm_${Date.now()}_${referrerId}`);

                const walletSnap = await transaction.get(referrerWalletRef);
                if (!walletSnap.exists()) {
                    throw new Error('Referrer wallet not found');
                }

                const currentBalance = walletSnap.data().balance || 0;

                // Create commission record
                transaction.set(commissionRef, {
                    referrerId,
                    referredUserId,
                    amount: commissionAmount,
                    membershipTier,
                    createdAt: new Date()
                });

                // Update referrer's wallet
                transaction.update(referrerWalletRef, {
                    balance: currentBalance + commissionAmount
                });
            });

            return {
                success: true,
                message: `Commission of R${commissionAmount} processed successfully`
            };

        } catch (error: any) {
            return {
                success: false,
                message: `Commission processing failed: ${error.message}`
            };
        }
    }

    async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
        const now = Timestamp.now();
        return await addDoc(collection(db, 'transactions'), {
          ...transaction,
          createdAt: now,
          updatedAt: now,
        });
      }
    
      async processCommissionPayout(referrerId: string, amount: number, referralId: string, membershipTier: string) {
        const commissionRates = {
          'Basic': 0.01,
          'Ambassador': 0.02,
          'VIP': 0.03,
          'Business': 0.05
        };
    
        const commissionRate = commissionRates[membershipTier as keyof typeof commissionRates];
        const commissionAmount = amount * commissionRate;
    
        try {
          await runTransaction(db, async (transaction) => {
            // Get referrer's wallet
            const walletRef = doc(db, 'wallets', referrerId);
            const walletDoc = await transaction.get(walletRef);
    
            if (!walletDoc.exists()) {
              throw new Error('Referrer wallet not found');
            }
    
            // Create commission transaction
            const commissionTxn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
              userId: referrerId,
              type: 'commission',
              amount: commissionAmount,
              status: 'pending',
              metadata: {
                referralId,
                membershipTier,
                commissionRate,
                description: `Commission for referral ${referralId}`
              }
            };
    
            const txnRef = await this.createTransaction(commissionTxn);
    
            // Update wallet balance
            const currentBalance = walletDoc.data()?.balance || 0;
            transaction.update(walletRef, {
              balance: currentBalance + commissionAmount,
              lastUpdated: Timestamp.now()
            });
    
            return txnRef;
          });
        } catch (error) {
          console.error('Commission payout failed:', error);
          throw error;
        }
      }
    
      async processEscrowRelease(tradeId: string, buyerId: string, sellerId: string, amount: number) {
        try {
          await runTransaction(db, async (transaction) => {
            const buyerWalletRef = doc(db, 'wallets', buyerId);
            const sellerWalletRef = doc(db, 'wallets', sellerId);
            const tradeRef = doc(db, 'trades', tradeId);
    
            const [buyerWallet, sellerWallet, trade] = await Promise.all([
              transaction.get(buyerWalletRef),
              transaction.get(sellerWalletRef),
              transaction.get(tradeRef)
            ]);
    
            if (!buyerWallet.exists() || !sellerWallet.exists() || !trade.exists()) {
              throw new Error('Required documents not found');
            }
    
            // Release escrow to seller
            const sellerBalance = sellerWallet.data()?.balance || 0;
            transaction.update(sellerWalletRef, {
              balance: sellerBalance + amount,
              lastUpdated: Timestamp.now()
            });
    
            // Create transaction records
            await Promise.all([
              this.createTransaction({
                userId: sellerId,
                type: 'escrow',
                amount: amount,
                status: 'completed',
                metadata: {
                  tradeId,
                  description: `Escrow release for trade ${tradeId}`
                }
              }),
              this.createTransaction({
                userId: buyerId,
                type: 'escrow',
                amount: -amount,
                status: 'completed',
                metadata: {
                  tradeId,
                  description: `Escrow transfer for trade ${tradeId}`
                }
              })
            ]);
    
            // Update trade status
            transaction.update(tradeRef, {
              status: 'completed',
              completedAt: Timestamp.now()
            });
          });
        } catch (error) {
          console.error('Escrow release failed:', error);
          throw error;
        }
      }
    
      async getTransactionHistory(userId: string, options: {
        type?: Transaction['type'],
        status?: Transaction['status'],
        limit?: number,
        startAfter?: Date
      } = {}) {
        try {
          let q = query(
            collection(db, 'transactions'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          );
    
          if (options.type) {
            q = query(q, where('type', '==', options.type));
          }
    
          if (options.status) {
            q = query(q, where('status', '==', options.status));
          }
    
          if (options.startAfter) {
            q = query(q, where('createdAt', '<', Timestamp.fromDate(options.startAfter)));
          }
    
          if (options.limit) {
            q = query(q, limit(options.limit));
          }
    
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Transaction));
        } catch (error) {
          console.error('Failed to get transaction history:', error);
          throw error;
        }
      }
}

export const transactionService = new TransactionService();