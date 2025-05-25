import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  query,
  where, 
  orderBy,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ServiceClient } from './service-client';
import { validateLoanAmount } from './membership-tiers';
import { notificationService } from './notification-service';
import { membershipService } from './membership-service';

export interface LoanApplication {
  id?: string;
  userId: string;
  amount: number;
  term: number; // In days
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Funded' | 'Repaid' | 'Defaulted';
  interest: number;
  createdAt: Date | Timestamp;
  approvedAt?: Date | Timestamp;
  fundedAt?: Date | Timestamp;
  repaidAt?: Date | Timestamp;
  repaymentAmount?: number;
  repaymentDeadline?: Date | Timestamp;
  borrowerWalletShare?: number; // Amount that goes to borrower's wallet (5% of repayment)
  loanReviewerId?: string;
  fundingTransactionId?: string;
  repaymentTransactionId?: string;
  notes?: string;
}

export interface LoanRepayment {
  id?: string;
  loanId: string;
  userId: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  createdAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
  transactionId?: string;
}

class LoanService extends ServiceClient {
  private db = getFirestore();

  /**
   * Apply for a loan
   */
  async applyForLoan(userId: string, applicationData: Partial<LoanApplication>): Promise<string> {
    try {
      // Get user's membership tier to validate loan amount
      const userProfile = await membershipService.getUserMembership(userId);
      
      if (!userProfile || !userProfile.tierName) {
        throw new Error('User does not have an active membership');
      }
      
      // Validate loan amount based on user's tier
      const isValidAmount = validateLoanAmount(userProfile.tierName, applicationData.amount || 0);
      if (!isValidAmount) {
        throw new Error('Requested loan amount exceeds tier limit');
      }
      
      // Calculate standard repayment amount (loan amount + 25%)
      const repaymentAmount = (applicationData.amount || 0) * 1.25;
      
      // Calculate borrower wallet share (5% of repayment)
      const borrowerWalletShare = repaymentAmount * 0.05;
      
      // Set repayment deadline (term days from now)
      const repaymentDeadline = new Date();
      repaymentDeadline.setDate(repaymentDeadline.getDate() + (applicationData.term || 30));
      
      // Create loan application
      const loanApplication: LoanApplication = {
        userId,
        amount: applicationData.amount || 0,
        term: applicationData.term || 30,
        purpose: applicationData.purpose || 'General purpose',
        status: 'Pending',
        interest: 25, // Standard 25% interest
        createdAt: new Date(),
        repaymentAmount,
        repaymentDeadline,
        borrowerWalletShare
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(this.db, 'loan_applications'), loanApplication);
      
      // Send notification to user
      await notificationService.sendNotification({
        userId,
        type: 'Loan',
        title: 'Loan Application Received',
        message: `Your loan application for ${applicationData.amount} has been received and is under review.`,
        data: {
          loanId: docRef.id,
          amount: applicationData.amount
        }
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error applying for loan:', error);
      throw error;
    }
  }
  
  /**
   * Get user's loan applications
   */
  async getUserLoans(userId: string): Promise<LoanApplication[]> {
    try {
      const loansQuery = query(
        collection(this.db, 'loan_applications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(loansQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LoanApplication));
      
    } catch (error) {
      console.error('Error getting user loans:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific loan by ID
   */
  async getLoanById(loanId: string): Promise<LoanApplication | null> {
    try {
      const loanDoc = await getDoc(doc(this.db, 'loan_applications', loanId));
      if (!loanDoc.exists()) {
        return null;
      }
      
      return {
        id: loanDoc.id,
        ...loanDoc.data()
      } as LoanApplication;
      
    } catch (error) {
      console.error('Error getting loan by ID:', error);
      throw error;
    }
  }
  
  /**
   * Review and approve/reject a loan application
   */
  async reviewLoan(loanId: string, reviewerId: string, approved: boolean, notes?: string): Promise<void> {
    try {
      const loanRef = doc(this.db, 'loan_applications', loanId);
      const loanDoc = await getDoc(loanRef);
      
      if (!loanDoc.exists()) {
        throw new Error('Loan application not found');
      }
      
      const loanData = loanDoc.data() as LoanApplication;
      
      // Update loan status
      await updateDoc(loanRef, {
        status: approved ? 'Approved' : 'Rejected',
        loanReviewerId: reviewerId,
        approvedAt: approved ? new Date() : null,
        notes: notes || '',
        updatedAt: new Date()
      });
      
      // Send notification to user
      await notificationService.sendNotification({
        userId: loanData.userId,
        type: 'Loan',
        title: approved ? 'Loan Application Approved' : 'Loan Application Rejected',
        message: approved 
          ? `Your loan application for ${loanData.amount} has been approved! Funds will be transferred shortly.`
          : `Your loan application for ${loanData.amount} has been rejected. Reason: ${notes || 'Not specified'}`,
        data: {
          loanId,
          amount: loanData.amount,
          approved
        }
      });
      
    } catch (error) {
      console.error('Error reviewing loan:', error);
      throw error;
    }
  }
  
  /**
   * Fund an approved loan
   */
  async fundLoan(loanId: string, transactionId: string): Promise<void> {
    try {
      const loanRef = doc(this.db, 'loan_applications', loanId);
      const loanDoc = await getDoc(loanRef);
      
      if (!loanDoc.exists()) {
        throw new Error('Loan application not found');
      }
      
      const loanData = loanDoc.data() as LoanApplication;
      
      if (loanData.status !== 'Approved') {
        throw new Error('Loan must be approved before funding');
      }
      
      // Update loan status
      await updateDoc(loanRef, {
        status: 'Funded',
        fundedAt: new Date(),
        fundingTransactionId: transactionId,
        updatedAt: new Date()
      });
      
      // Send notification to user
      await notificationService.sendNotification({
        userId: loanData.userId,
        type: 'Loan',
        title: 'Loan Funded',
        message: `Your loan of ${loanData.amount} has been funded and is now available in your account.`,
        data: {
          loanId,
          amount: loanData.amount,
          transactionId
        }
      });
      
    } catch (error) {
      console.error('Error funding loan:', error);
      throw error;
    }
  }
  
  /**
   * Record loan repayment
   */
  async repayLoan(loanId: string, userId: string, transactionId: string): Promise<void> {
    try {
      const loanRef = doc(this.db, 'loan_applications', loanId);
      
      await runTransaction(this.db, async (transaction) => {
        const loanDoc = await transaction.get(loanRef);
        
        if (!loanDoc.exists()) {
          throw new Error('Loan not found');
        }
        
        const loanData = loanDoc.data() as LoanApplication;
        
        if (loanData.userId !== userId) {
          throw new Error('User is not authorized to repay this loan');
        }
        
        if (loanData.status !== 'Funded') {
          throw new Error('Loan is not in a state that can be repaid');
        }
        
        // Update loan status
        transaction.update(loanRef, {
          status: 'Repaid',
          repaidAt: new Date(),
          repaymentTransactionId: transactionId,
          updatedAt: new Date()
        });
        
        // Record the repayment
        const repaymentData: LoanRepayment = {
          loanId,
          userId,
          amount: loanData.repaymentAmount || 0,
          status: 'Completed',
          createdAt: new Date(),
          completedAt: new Date(),
          transactionId
        };
        
        const repaymentRef = collection(this.db, 'loan_repayments');
        transaction.set(doc(repaymentRef), repaymentData);
        
        // Add borrower wallet share to user's wallet balance (5% of repayment)
        const userRef = doc(this.db, 'users', userId);
        const userDoc = await transaction.get(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentBalance = userData.walletBalance || 0;
          const newBalance = currentBalance + (loanData.borrowerWalletShare || 0);
          
          transaction.update(userRef, {
            walletBalance: newBalance,
            updatedAt: new Date()
          });
        }
      });
      
      // Get loan data for notification
      const loanDoc = await getDoc(loanRef);
      const loanData = loanDoc.data() as LoanApplication;
      
      // Send notification to user
      await notificationService.sendNotification({
        userId,
        type: 'Loan',
        title: 'Loan Repayment Confirmed',
        message: `Your loan repayment of ${loanData.repaymentAmount} has been confirmed. ${loanData.borrowerWalletShare} has been added to your wallet.`,
        data: {
          loanId,
          repaymentAmount: loanData.repaymentAmount,
          walletShare: loanData.borrowerWalletShare,
          transactionId
        }
      });
      
    } catch (error) {
      console.error('Error repaying loan:', error);
      throw error;
    }
  }
  
  /**
   * Get all pending loan applications
   * For admin use
   */
  async getPendingLoans(): Promise<LoanApplication[]> {
    try {
      const loansQuery = query(
        collection(this.db, 'loan_applications'),
        where('status', '==', 'Pending'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(loansQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LoanApplication));
      
    } catch (error) {
      console.error('Error getting pending loans:', error);
      throw error;
    }
  }
  
  /**
   * Get loans that are at risk of defaulting
   * For admin/support monitoring
   */
  async getLoansAtRisk(): Promise<LoanApplication[]> {
    try {
      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(now.getDate() + 5); // Loans due within 5 days
      
      const loansQuery = query(
        collection(this.db, 'loan_applications'),
        where('status', '==', 'Funded'),
        where('repaymentDeadline', '<=', thresholdDate),
        where('repaymentDeadline', '>=', now),
        orderBy('repaymentDeadline', 'asc')
      );
      
      const snapshot = await getDocs(loansQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LoanApplication));
      
    } catch (error) {
      console.error('Error getting loans at risk:', error);
      throw error;
    }
  }
  
  /**
   * Mark loans as defaulted if past due date
   * Should be run as a scheduled job
   */
  async processLoanDefaults(): Promise<number> {
    try {
      const now = new Date();
      
      // Find loans that are past due
      const loansQuery = query(
        collection(this.db, 'loan_applications'),
        where('status', '==', 'Funded'),
        where('repaymentDeadline', '<', now)
      );
      
      const snapshot = await getDocs(loansQuery);
      let defaultedCount = 0;
      
      // Update each loan to defaulted status
      const batch = this.db.batch;
      snapshot.docs.forEach(doc => {
        const loanRef = doc(this.db, 'loan_applications', doc.id);
        batch.update(loanRef, {
          status: 'Defaulted',
          updatedAt: new Date()
        });
        defaultedCount++;
        
        // Send notification to user
        const loanData = doc.data() as LoanApplication;
        notificationService.sendNotification({
          userId: loanData.userId,
          type: 'Loan',
          title: 'Loan Payment Overdue',
          message: `Your loan payment of ${loanData.repaymentAmount} is overdue. Please make payment immediately to avoid penalties.`,
          data: {
            loanId: doc.id,
            amount: loanData.amount,
            repaymentAmount: loanData.repaymentAmount
          }
        });
      });
      
      if (defaultedCount > 0) {
        await batch.commit();
      }
      
      return defaultedCount;
      
    } catch (error) {
      console.error('Error processing loan defaults:', error);
      throw error;
    }
  }
  
  /**
   * Get loan statistics
   * For analytics dashboard
   */
  async getLoanStatistics() {
    try {
      const stats = {
        totalLoans: 0,
        totalAmount: 0,
        approvalRate: 0,
        defaultRate: 0,
        averageLoanAmount: 0,
        activeLoanCount: 0,
        activeLoanAmount: 0
      };
      
      // Get all loans
      const loansSnapshot = await getDocs(collection(this.db, 'loan_applications'));
      
      if (loansSnapshot.empty) {
        return stats;
      }
      
      const loans = loansSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as LoanApplication[];
      
      // Calculate statistics
      stats.totalLoans = loans.length;
      stats.totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
      
      const approvedLoans = loans.filter(loan => 
        ['Approved', 'Funded', 'Repaid'].includes(loan.status));
      stats.approvalRate = approvedLoans.length / loans.length;
      
      const defaultedLoans = loans.filter(loan => loan.status === 'Defaulted');
      const completedLoans = loans.filter(loan => 
        ['Repaid', 'Defaulted'].includes(loan.status));
      stats.defaultRate = completedLoans.length > 0 ? 
        defaultedLoans.length / completedLoans.length : 0;
      
      stats.averageLoanAmount = stats.totalLoans > 0 ? 
        stats.totalAmount / stats.totalLoans : 0;
      
      const activeLoans = loans.filter(loan => loan.status === 'Funded');
      stats.activeLoanCount = activeLoans.length;
      stats.activeLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);
      
      return stats;
      
    } catch (error) {
      console.error('Error getting loan statistics:', error);
      throw error;
    }
  }
}

export const loanService = new LoanService();
