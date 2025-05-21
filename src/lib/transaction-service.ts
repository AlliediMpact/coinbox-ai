import { getFirestore, collection, query, where, orderBy, getDocs, doc } from 'firebase/firestore';

// Import from our mocked module for functions that are giving us import trouble
import { 
  setDoc, 
  updateDoc, 
  getDoc,
  runTransaction,
  addDoc,
  DocumentReference,
  Timestamp,
  limit,
  serverTimestamp,
  Transaction as FirestoreTransaction
} from './mocked-firebase';
import { getTierConfig, MembershipTierType } from './membership-tiers';
import { db } from './firebase';
import { paystackService } from './paystack-service';
import { auditService } from './audit-service';

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
            const riskAssessment = {
                riskScore: 50, // Default medium risk score
                riskLevel: 'medium' as 'low' | 'medium' | 'high' | 'extreme',
                factors: ['Simplified risk assessment for demo']
            };

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
            const transactionFee = tierConfig.txnFee;

            // Create escrow transaction
            await runTransaction(this.db, async (transaction: FirestoreTransaction) => {
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
            const transactionFee = tierConfig.txnFee;

            // Create investment record with escrow
            await runTransaction(this.db, async (transaction: FirestoreTransaction) => {
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
            const commissionRate = tierConfig.commission;
            const securityFee = tierConfig.securityFee;
            
            // Calculate commission amount
            const commissionAmount = (securityFee * commissionRate) / 100;

            await runTransaction(this.db, async (transaction: FirestoreTransaction) => {
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

    async createTransaction(transactionData: { 
        userId: string;
        type: string;
        amount: number;
        status: string;
        metadata?: {
          description?: string;
          [key: string]: any;
        }
      }) {
        const now = Timestamp.now();
        const docRef = await addDoc(collection(db, 'transactions'), {
          ...transactionData,
          createdAt: now,
          updatedAt: now,
        });
        
        // Log the transaction in the audit trail
        await auditService.logFinancialTransaction(
          'transaction_initiated',
          docRef.id,
          transactionData.userId,
          {
            amount: transactionData.amount,
            type: transactionData.type,
            reason: transactionData.metadata?.description || `${transactionData.type} transaction`
          },
          transactionData.metadata
        );
        
        return docRef;
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
          let txnId = `comm_${Date.now()}_${referrerId}`; // Generate deterministic ID for audit logging
          
          await runTransaction(db, async (transaction: FirestoreTransaction) => {
            // Get referrer's wallet
            const walletRef = doc(db, 'wallets', referrerId);
            const walletDoc = await transaction.get(walletRef);
    
            if (!walletDoc.exists()) {
              throw new Error('Referrer wallet not found');
            }
            
            const currentBalance = walletDoc.data()?.balance || 0;
            
            // Create a transaction document reference with our generated ID
            const txnRef = doc(db, 'transactions', txnId);
            
            // Create commission transaction record
            const now = Timestamp.now();
            transaction.set(txnRef, {
              userId: referrerId,
              type: 'commission',
              amount: commissionAmount,
              status: 'completed', // Mark as completed immediately
              createdAt: now,
              updatedAt: now,
              metadata: {
                referralId,
                membershipTier,
                commissionRate,
                description: `Commission for referral ${referralId}`
              }
            });
    
            // Update wallet balance
            transaction.update(walletRef, {
              balance: currentBalance + commissionAmount,
              lastUpdated: now
            });
    
            return txnRef;
          });
          
          // Log to audit trail after successful transaction
          await auditService.logFinancialTransaction(
            'transaction_completed',
            txnId,
            referrerId,
            {
              amount: commissionAmount,
              type: 'commission',
              before: 0,
              after: commissionAmount,
              reason: `Commission for referral ${referralId}`
            },
            {
              referralId,
              membershipTier,
              commissionRate
            }
          );
          
          // Return the transaction ID
          return { id: txnId, success: true };
          
        } catch (error) {
          console.error('Commission payout failed:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Log failure to audit trail
          await auditService.logFinancialTransaction(
            'transaction_failed',
            'commission_' + Date.now(),
            referrerId,
            {
              amount: commissionAmount,
              type: 'commission',
              reason: `Failed commission for referral ${referralId}: ${errorMessage}`
            },
            {
              referralId,
              membershipTier,
              commissionRate,
              error: errorMessage
            }
          );
          
          throw error;
        }
      }
    
      async processEscrowRelease(tradeId: string, buyerId: string, sellerId: string, amount: number) {
        try {
          // Generate deterministic transaction IDs for audit trail
          const sellerTxnId = `escrow_seller_${tradeId}_${Date.now()}`;
          const buyerTxnId = `escrow_buyer_${tradeId}_${Date.now()}`;
          
          await runTransaction(db, async (transaction: FirestoreTransaction) => {
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
            const buyerBalance = buyerWallet.data()?.balance || 0;
            
            transaction.update(sellerWalletRef, {
              balance: sellerBalance + amount,
              lastUpdated: Timestamp.now()
            });
    
            // Create transaction records within the transaction
            const sellerTxnRef = doc(db, 'transactions', sellerTxnId);
            const buyerTxnRef = doc(db, 'transactions', buyerTxnId);
            
            const now = Timestamp.now();
            
            // Seller transaction
            transaction.set(sellerTxnRef, {
              userId: sellerId,
              type: 'escrow',
              amount: amount,
              status: 'completed',
              createdAt: now,
              updatedAt: now,
              metadata: {
                tradeId,
                description: `Escrow release for trade ${tradeId}`
              }
            });
            
            // Buyer transaction
            transaction.set(buyerTxnRef, {
              userId: buyerId,
              type: 'escrow',
              amount: -amount,
              status: 'completed',
              createdAt: now,
              updatedAt: now,
              metadata: {
                tradeId,
                description: `Escrow transfer for trade ${tradeId}`
              }
            });
    
            // Update trade status
            transaction.update(tradeRef, {
              status: 'completed',
              completedAt: Timestamp.now()
            });
          });
          
          // After transaction is successful, log to audit trail
          await Promise.all([
            auditService.logFinancialTransaction(
              'transaction_completed',
              sellerTxnId,
              sellerId,
              {
                amount: amount,
                type: 'escrow',
                before: 0,
                after: amount,
                reason: `Escrow release for trade ${tradeId}`
              },
              { tradeId }
            ),
            auditService.logFinancialTransaction(
              'transaction_completed',
              buyerTxnId,
              buyerId,
              {
                amount: -amount,
                type: 'escrow',
                before: amount,
                after: 0,
                reason: `Escrow transfer for trade ${tradeId}`
              },
              { tradeId }
            )
          ]);
          
        } catch (error) {
          console.error('Escrow release failed:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Log the failure to audit trail
          await auditService.logSystemAction(
            'transaction_failed',
            'transaction',
            `trade_${tradeId}`,
            'system',
            {
              action: 'Escrow release failed',
              amount: amount,
              error: errorMessage,
              buyerId,
              sellerId
            }
          );
          
          throw error;
        }
      }
    
      async getTransactionHistory(userId: string, options: {
        type?: string,
        status?: string,
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
          }));
        } catch (error) {
          console.error('Failed to get transaction history:', error);
          throw error;
        }
      }
}

export const transactionService = new TransactionService();