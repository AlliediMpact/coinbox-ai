import { commissionAutomationService } from './commission-automation-service';
import { enhancedPaystackService } from './paystack-service-enhanced';
import { notificationService } from './basic-notification-service';

/**
 * Commission Scheduler Service
 * Handles automated commission payouts on a scheduled basis
 */
class CommissionSchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  // Configuration
  private readonly PAYOUT_SCHEDULE = {
    // Run every 24 hours (daily check)
    interval: 24 * 60 * 60 * 1000,
    // Minimum amount to trigger payout (R50)
    minimumPayoutAmount: 50,
    // Maximum retries for failed payouts
    maxRetries: 3,
    // Delay between retries (1 hour)
    retryDelay: 60 * 60 * 1000
  };

  /**
   * Start the commission scheduler
   */
  async startScheduler(): Promise<void> {
    if (this.isRunning) {
      console.log('Commission scheduler is already running');
      return;
    }

    console.log('Starting commission scheduler...');
    this.isRunning = true;

    // Run initial payout check
    await this.processScheduledPayouts();

    // Set up recurring schedule
    this.intervalId = setInterval(async () => {
      await this.processScheduledPayouts();
    }, this.PAYOUT_SCHEDULE.interval);

    console.log(`Commission scheduler started. Next payout check in ${this.PAYOUT_SCHEDULE.interval / 1000 / 60 / 60} hours`);
  }

  /**
   * Stop the commission scheduler
   */
  stopScheduler(): void {
    if (!this.isRunning) {
      console.log('Commission scheduler is not running');
      return;
    }

    console.log('Stopping commission scheduler...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Commission scheduler stopped');
  }

  /**
   * Process all scheduled commission payouts
   */
  private async processScheduledPayouts(): Promise<void> {
    try {
      console.log('Processing scheduled commission payouts...');

      // Get all pending commissions
      const pendingCommissions = await commissionAutomationService.getPendingCommissions();
      
      if (pendingCommissions.length === 0) {
        console.log('No pending commissions found');
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
      console.error('Error processing scheduled payouts:', error);
      
      // Send alert to admin about failed automated payout
      await notificationService.sendSystemAlert({
        type: 'commission_payout_failed',
        message: 'Automated commission payout process failed',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Process payout for a specific referrer
   */
  private async processReferrerPayout(referrerId: string, commissions: any[]): Promise<void> {
    try {
      // Calculate total payout amount
      const totalAmount = commissions.reduce((sum, comm) => sum + comm.amount, 0);

      // Check if amount meets minimum threshold
      if (totalAmount < this.PAYOUT_SCHEDULE.minimumPayoutAmount) {
        console.log(`Skipping payout for referrer ${referrerId}: Amount ${totalAmount} below minimum ${this.PAYOUT_SCHEDULE.minimumPayoutAmount}`);
        return;
      }

      console.log(`Processing payout for referrer ${referrerId}: R${totalAmount}`);

      // Create payout using commission automation service
      const payout = await commissionAutomationService.createBulkPayout(
        referrerId,
        commissions.map(c => c.id!)
      );

      // Process the payout through Paystack
      await this.executePaystackPayout(payout);

      console.log(`Successfully processed payout ${payout.id} for referrer ${referrerId}`);

    } catch (error) {
      console.error(`Error processing payout for referrer ${referrerId}:`, error);
      
      // Update commission status to failed
      const commissionIds = commissions.map(c => c.id!);
      await commissionAutomationService.updateCommissionStatus(commissionIds, 'failed');
      
      // Send notification to referrer about failed payout
      await notificationService.sendNotification({
        userId: referrerId,
        type: 'commission_payout_failed',
        title: 'Commission Payout Failed',
        message: 'We encountered an issue processing your commission payout. Please contact support.',
        timestamp: new Date()
      });
    }
  }

  /**
   * Execute payout through Paystack
   */
  private async executePaystackPayout(payout: any): Promise<void> {
    try {
      // Get referrer details for payout
      const referrerDetails = await this.getReferrerPayoutDetails(payout.referrerId);
      
      // Initialize transfer through Paystack
      const transferResult = await enhancedPaystackService.initializeTransfer({
        amount: Math.round(payout.totalAmount * 100), // Convert to kobo
        recipient: referrerDetails.recipientCode,
        reason: `Commission payout for ${payout.commissionCount} referrals`,
        reference: payout.paymentReference
      });

      // Update payout status
      await commissionAutomationService.updatePayoutStatus(payout.id!, 'completed');
      
      // Update individual commission statuses
      await commissionAutomationService.updateCommissionStatus(payout.commissionIds, 'paid');

      // Send success notification
      await notificationService.sendNotification({
        userId: payout.referrerId,
        type: 'commission_payout_success',
        title: 'Commission Payout Successful',
        message: `Your commission payout of R${payout.totalAmount} has been processed successfully.`,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error executing Paystack payout:', error);
      
      // Update payout status to failed
      await commissionAutomationService.updatePayoutStatus(payout.id!, 'failed');
      throw error;
    }
  }

  /**
   * Get referrer payout details (bank account, etc.)
   */
  private async getReferrerPayoutDetails(referrerId: string): Promise<{ recipientCode: string }> {
    // This would typically fetch from user profile/banking details
    // For now, return a placeholder - this should be implemented with actual user banking details
    return {
      recipientCode: `recipient_${referrerId}` // This should be actual Paystack recipient code
    };
  }

  /**
   * Group commissions by referrer ID
   */
  private groupCommissionsByReferrer(commissions: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    commissions.forEach(commission => {
      const referrerId = commission.referrerId;
      if (!grouped.has(referrerId)) {
        grouped.set(referrerId, []);
      }
      grouped.get(referrerId)!.push(commission);
    });

    return grouped;
  }

  /**
   * Manual trigger for testing or emergency payouts
   */
  async triggerManualPayout(referrerId?: string): Promise<void> {
    console.log('Triggering manual payout process...');
    
    if (referrerId) {
      // Process specific referrer
      const commissions = await commissionAutomationService.getPendingCommissions();
      const referrerCommissions = commissions.filter(c => c.referrerId === referrerId);
      
      if (referrerCommissions.length > 0) {
        await this.processReferrerPayout(referrerId, referrerCommissions);
      } else {
        console.log(`No pending commissions found for referrer ${referrerId}`);
      }
    } else {
      // Process all pending payouts
      await this.processScheduledPayouts();
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.intervalId ? new Date(Date.now() + this.PAYOUT_SCHEDULE.interval) : undefined
    };
  }
}

export const commissionSchedulerService = new CommissionSchedulerService();

// Auto-start scheduler in production environment
if (process.env.NODE_ENV === 'production') {
  commissionSchedulerService.startScheduler().catch(console.error);
}
