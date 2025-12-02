import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { notificationService } from './notification-service';
import { emailService } from './email-service';

export interface LoanRepayment {
  loanId: string;
  borrowerId: string;
  investorId: string;
  amount: number;
  interest: number;
  repaymentAmount: number;
  dueDate: Date;
  status: 'active' | 'overdue' | 'paid' | 'defaulted';
}

class LoanRepaymentService {
  /**
   * Check for upcoming loan repayments and send reminders
   * This should be called daily via cron job
   */
  async checkUpcomingRepayments(): Promise<void> {
    const today = new Date();
    const sevenDaysAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    try {
      // Find active loans due within the next 7 days
      const escrowRef = collection(db, 'escrow');
      const upcomingLoansQuery = query(
        escrowRef,
        where('status', '==', 'Active'),
        where('dueDate', '<=', Timestamp.fromDate(sevenDaysAhead))
      );

      const upcomingLoans = await getDocs(upcomingLoansQuery);

      for (const loanDoc of upcomingLoans.docs) {
        const loan = loanDoc.data();
        const daysUntilDue = this.calculateDaysUntilDue(loan.dueDate.toDate());

        // Send reminders at 7 days, 3 days, and 1 day before due date
        if ([7, 3, 1].includes(daysUntilDue)) {
          await this.sendRepaymentReminder(loanDoc.id, loan, daysUntilDue);
        }

        // Check if loan is overdue
        if (daysUntilDue < 0 && loan.status === 'Active') {
          await this.markAsOverdue(loanDoc.id, loan);
        }
      }
    } catch (error) {
      console.error('Error checking upcoming repayments:', error);
      throw error;
    }
  }

  /**
   * Send repayment reminder to borrower
   */
  private async sendRepaymentReminder(
    loanId: string,
    loan: any,
    daysUntilDue: number
  ): Promise<void> {
    try {
      // Get borrower details
      const borrowerDoc = await getDoc(doc(db, 'users', loan.borrowerId));
      const borrower = borrowerDoc.data();

      if (!borrower) {
        console.error(`Borrower ${loan.borrowerId} not found`);
        return;
      }

      const reminderMessage =
        daysUntilDue === 1
          ? `⚠️ URGENT: Your loan repayment of R${loan.repaymentAmount} is due TOMORROW!`
          : `Reminder: Your loan repayment of R${loan.repaymentAmount} is due in ${daysUntilDue} days.`;

      // Send in-app notification
      await notificationService.createNotification({
        userId: loan.borrowerId,
        type: 'loan_reminder',
        title: 'Loan Repayment Due Soon',
        message: reminderMessage,
        priority: daysUntilDue === 1 ? 'high' : 'medium',
        metadata: {
          loanId,
          daysUntilDue,
          repaymentAmount: loan.repaymentAmount,
          dueDate: loan.dueDate.toDate().toISOString(),
        },
      });

      // Send email notification
      await emailService.sendEmail({
        to: borrower.email,
        subject: `Loan Repayment Reminder - Due in ${daysUntilDue} Day${daysUntilDue > 1 ? 's' : ''}`,
        template: 'loan_reminder',
        data: {
          borrowerName: borrower.fullName,
          loanAmount: loan.amount,
          interestAmount: (loan.repaymentAmount - loan.amount).toFixed(2),
          repaymentAmount: loan.repaymentAmount,
          dueDate: loan.dueDate.toDate().toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          daysUntilDue,
          paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/trading`,
        },
      });

      console.log(
        `Sent ${daysUntilDue}-day reminder for loan ${loanId} to ${borrower.email}`
      );

      // Update loan document to track reminder sent
      await updateDoc(doc(db, 'escrow', loanId), {
        [`remindersSent.${daysUntilDue}days`]: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error sending reminder for loan ${loanId}:`, error);
    }
  }

  /**
   * Mark loan as overdue and send overdue notice
   */
  private async markAsOverdue(loanId: string, loan: any): Promise<void> {
    try {
      // Update loan status to overdue
      await updateDoc(doc(db, 'escrow', loanId), {
        status: 'Overdue',
        overdueDate: Timestamp.now(),
      });

      // Get borrower details
      const borrowerDoc = await getDoc(doc(db, 'users', loan.borrowerId));
      const borrower = borrowerDoc.data();

      if (!borrower) return;

      // Send overdue notification
      await notificationService.createNotification({
        userId: loan.borrowerId,
        type: 'alert',
        title: '⚠️ Loan Payment Overdue',
        message: `Your loan repayment of R${loan.repaymentAmount} is now overdue. Please make payment immediately to avoid penalties.`,
        priority: 'high',
        metadata: {
          loanId,
          repaymentAmount: loan.repaymentAmount,
        },
      });

      // Send overdue email
      await emailService.sendEmail({
        to: borrower.email,
        subject: 'URGENT: Loan Payment Overdue - Immediate Action Required',
        template: 'loan_overdue',
        data: {
          borrowerName: borrower.fullName,
          repaymentAmount: loan.repaymentAmount,
          dueDate: loan.dueDate.toDate().toLocaleDateString('en-ZA'),
          daysOverdue: Math.abs(this.calculateDaysUntilDue(loan.dueDate.toDate())),
          paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/trading`,
        },
      });

      // Notify admin
      await notificationService.createNotification({
        userId: 'admin',
        type: 'alert',
        title: 'Loan Payment Overdue',
        message: `Loan ${loanId} by ${borrower.fullName} is now overdue (R${loan.repaymentAmount}).`,
        priority: 'high',
        metadata: {
          loanId,
          borrowerId: loan.borrowerId,
          repaymentAmount: loan.repaymentAmount,
        },
      });

      console.log(`Marked loan ${loanId} as overdue`);
    } catch (error) {
      console.error(`Error marking loan ${loanId} as overdue:`, error);
    }
  }

  /**
   * Process loan repayment
   */
  async processRepayment(loanId: string, borrowerId: string): Promise<boolean> {
    try {
      // Get loan details
      const loanDoc = await getDoc(doc(db, 'escrow', loanId));

      if (!loanDoc.exists()) {
        throw new Error('Loan not found');
      }

      const loan = loanDoc.data();

      // Verify borrower
      if (loan.borrowerId !== borrowerId) {
        throw new Error('Unauthorized: Not the borrower of this loan');
      }

      // Check borrower's wallet balance
      const walletDoc = await getDoc(doc(db, 'wallets', borrowerId));
      const wallet = walletDoc.data();

      if (!wallet || wallet.balance < loan.repaymentAmount) {
        throw new Error('Insufficient balance for repayment');
      }

      // Deduct from borrower's wallet
      await updateDoc(doc(db, 'wallets', borrowerId), {
        balance: wallet.balance - loan.repaymentAmount,
      });

      // Calculate distribution
      const principalAmount = loan.amount;
      const interestAmount = loan.repaymentAmount - loan.amount;
      const investorWalletShare = interestAmount * 0.05; // 5% to investor wallet
      const investorBankShare = interestAmount * 0.15; // 15% to investor bank
      const platformFee = loan.repaymentAmount * 0.25; // 25% repayment fee

      // Credit investor wallet (principal + 5% interest)
      const investorWalletDoc = await getDoc(doc(db, 'wallets', loan.investorId));
      const investorWallet = investorWalletDoc.data();

      await updateDoc(doc(db, 'wallets', loan.investorId), {
        balance: (investorWallet?.balance || 0) + principalAmount + investorWalletShare,
      });

      // TODO: Process bank transfer to investor for 15% share
      // This would use Paystack Transfer API

      // Update loan status
      await updateDoc(doc(db, 'escrow', loanId), {
        status: 'Completed',
        repaidAt: Timestamp.now(),
        repaymentDetails: {
          investorWalletShare,
          investorBankShare,
          platformFee,
        },
      });

      // Send success notifications
      await this.sendRepaymentSuccessNotification(loanId, loan);

      return true;
    } catch (error) {
      console.error('Error processing repayment:', error);
      throw error;
    }
  }

  /**
   * Send repayment success notifications
   */
  private async sendRepaymentSuccessNotification(
    loanId: string,
    loan: any
  ): Promise<void> {
    // Notify borrower
    await notificationService.createNotification({
      userId: loan.borrowerId,
      type: 'transaction',
      title: '✅ Loan Repayment Successful',
      message: `Your loan of R${loan.amount} has been successfully repaid. Thank you!`,
      priority: 'medium',
      metadata: { loanId },
    });

    // Notify investor
    await notificationService.createNotification({
      userId: loan.investorId,
      type: 'transaction',
      title: '💰 Loan Repayment Received',
      message: `You have received R${loan.repaymentAmount} from a loan repayment.`,
      priority: 'medium',
      metadata: { loanId },
    });
  }

  /**
   * Calculate days until due date
   */
  private calculateDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get user's active loans
   */
  async getUserLoans(userId: string): Promise<any[]> {
    const escrowRef = collection(db, 'escrow');
    const loansQuery = query(
      escrowRef,
      where('borrowerId', '==', userId),
      where('status', 'in', ['Active', 'Overdue'])
    );

    const loansSnapshot = await getDocs(loansQuery);
    return loansSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get overdue loans for admin
   */
  async getOverdueLoans(): Promise<any[]> {
    const escrowRef = collection(db, 'escrow');
    const overdueQuery = query(escrowRef, where('status', '==', 'Overdue'));

    const overdueSnapshot = await getDocs(overdueQuery);
    return overdueSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}

export const loanRepaymentService = new LoanRepaymentService();
