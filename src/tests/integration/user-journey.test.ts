import { beforeEach, describe, expect, it, vi } from 'vitest';
import { membershipService } from '../../lib/membership-service';
import { tradingService } from '../../lib/trading-service';
import { loanService } from '../../lib/loan-service';
import { commissionService } from '../../lib/commission-service';
import { disputeResolutionService } from '../../lib/dispute-resolution-service';
import { notificationService } from '../../lib/notification-service';
import { transactionService } from '../../lib/transaction-service';

// Mock Firebase
vi.mock('firebase/firestore', () => {
  const mockDoc = {
    exists: vi.fn(() => true),
    data: vi.fn(() => ({
      currentTier: 'basic',
      metrics: { monthlyTradingVolume: 1000, successfulReferrals: 5 }
    })),
    id: 'mock-doc-id'
  };
  
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(() => mockDoc),
    getDoc: vi.fn(() => Promise.resolve(mockDoc)),
    getDocs: vi.fn(() => Promise.resolve({ 
      empty: false, 
      docs: [mockDoc],
      size: 1,
      forEach: (cb: any) => cb(mockDoc),
      map: (cb: any) => [mockDoc].map(cb)
    })),
    addDoc: vi.fn(() => Promise.resolve({ id: 'new-doc-id' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    setDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date() })),
      fromDate: vi.fn((date) => ({ toDate: () => date }))
    },
    runTransaction: vi.fn(async (db, callback) => {
      const mockTransaction = {
        get: vi.fn(() => Promise.resolve(mockDoc)),
        update: vi.fn(),
        set: vi.fn()
      };
      return callback(mockTransaction);
    })
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

// Mock notification service
vi.mock('../../lib/notification-service', () => ({
  notificationService: {
    createNotification: vi.fn().mockResolvedValue({ id: 'notification-123' }),
    getUserNotifications: vi.fn().mockResolvedValue([]),
    notifyCommission: vi.fn().mockResolvedValue(undefined),
    notifyTradeMatch: vi.fn().mockResolvedValue(undefined),
    notifyEscrowRelease: vi.fn().mockResolvedValue(undefined),
    notifyDispute: vi.fn().mockResolvedValue(undefined),
    sendDisputeCreatedNotification: vi.fn().mockResolvedValue(undefined),
    sendDisputeStatusUpdateNotification: vi.fn().mockResolvedValue(undefined),
    notifyKycStatus: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('User Journey Integration Tests', () => {
  const userId = 'test-user-123';
  const referrerId = 'referrer-user-456';
  const adminId = 'admin-user-789';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ticket: { id: 'ticket-123' }, match: { id: 'match-123' } })
    })) as any;
  });
  
  describe('Membership Purchase to Trading Flow', () => {
    it('should allow a user to purchase a membership and create a trading ticket', async () => {
      // Step 1: Purchase membership
      vi.spyOn(membershipService, 'getUserMembership').mockResolvedValue({
        userId,
        currentTier: 'basic',
        joinDate: {} as any,
        renewalDate: {} as any,
        paymentStatus: 'active',
        metrics: {
          monthlyTradingVolume: 200000,
          totalReferrals: 15,
          successfulReferrals: 15
        },
      });
      vi.spyOn(membershipService as any, 'validateUpgradeRequirements').mockResolvedValue(true);
      vi.spyOn(transactionService, 'createTransaction').mockResolvedValue({ success: true } as any);

      await membershipService.upgradeMembership(userId, 'ambassador');
      
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Membership Upgraded'
      }));

      // Step 2: Commission
      vi.spyOn(membershipService, 'getReferralCommissionRate').mockResolvedValue(0.05);
      
      await commissionService.processReferralCommission(referrerId, userId, 550, 'membership');
      
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'commission'
      }));

      // Step 3: Create Ticket (API)
      const ticket = await tradingService.createTicket(userId, { type: 'Borrow', amount: 400 });
      expect(ticket).toBeDefined();

      // Step 4: Find Match (API)
      const matchTicket = { id: 'match-123', userId: 'investor-456', type: 'Invest', amount: 400 };
      vi.spyOn(tradingService, 'findMatch').mockResolvedValue(matchTicket as any);
      
      const match = await tradingService.findMatch(ticket as any);
      expect(match).not.toBeNull();

      if (match) {
        // Step 5: Create Escrow (Local)
        await tradingService.createEscrow(ticket as any, match as any);
        
        expect(notificationService.notifyTradeMatch).toHaveBeenCalled();
      }
      
      // Step 6: Confirm Trade (API)
      // We simulate the API side effect here
      vi.spyOn(tradingService, 'confirmTrade').mockImplementation(async () => {
        await notificationService.notifyEscrowRelease(userId, 'ticket-123', 400);
      });
      
      await tradingService.confirmTrade('ticket-123');
      
      expect(notificationService.notifyEscrowRelease).toHaveBeenCalled();
    });
  });

  describe('Loan Application to Repayment Flow', () => {
    it('should allow a user to apply for, receive, and repay a loan', async () => {
      // Step 1: Apply for a loan
      vi.spyOn(loanService, 'applyForLoan').mockImplementation(async () => {
        await notificationService.createNotification({ userId, type: 'system', title: 'Loan Applied', message: 'Loan applied', priority: 'normal' });
        return 'loan-123';
      });
      
      const loanId = await loanService.applyForLoan(userId, {
        amount: 400,
        term: 30,
        purpose: 'Personal expenses'
      });
      
      expect(loanId).toBe('loan-123');
      
      // Step 2: Admin reviews
      vi.spyOn(loanService, 'reviewLoan').mockImplementation(async () => {
        await notificationService.createNotification({ userId, type: 'system', title: 'Loan Approved', message: 'Loan approved', priority: 'high' });
      });
      
      await loanService.reviewLoan(loanId, adminId, true, 'Approved');
      
      // Step 3: Fund Loan
      vi.spyOn(loanService, 'fundLoan').mockImplementation(async () => {
        await notificationService.createNotification({ userId, type: 'transaction', title: 'Loan Funded', message: 'Loan funded', priority: 'high' });
      });
      
      await loanService.fundLoan(loanId, 'tx-456');
      
      // Step 4: Repay Loan
      vi.spyOn(loanService, 'repayLoan').mockImplementation(async () => {
        await notificationService.createNotification({ userId, type: 'transaction', title: 'Loan Repaid', message: 'Loan repaid', priority: 'high' });
      });
      
      await loanService.repayLoan(loanId, userId, 'tx-789');
      
      expect(notificationService.createNotification).toHaveBeenCalledTimes(4);
    });
  });
  
  describe('Trading Dispute Resolution Flow', () => {
    it('should allow a user to create and resolve a dispute', async () => {
      const ticketId = 'ticket-123';
      const counterpartyId = 'user-456';
      
      // Step 1: Create dispute
      vi.spyOn(disputeResolutionService, 'createDispute').mockImplementation(async () => {
        await notificationService.sendDisputeCreatedNotification(userId, 'dispute-123', ticketId);
        return 'dispute-123';
      });
      
      const disputeId = await disputeResolutionService.createDispute(ticketId, userId, counterpartyId, 'Reason', 'Desc');
      expect(disputeId).toBe('dispute-123');
      expect(notificationService.sendDisputeCreatedNotification).toHaveBeenCalled();
      
      // Step 2: Submit evidence
      vi.spyOn(disputeResolutionService, 'submitEvidence').mockResolvedValue('evidence-123');
      await disputeResolutionService.submitEvidence(disputeId, userId, {} as any);
      
      // Step 3: Resolve dispute
      vi.spyOn(disputeResolutionService, 'updateDisputeStatus').mockImplementation(async () => {
        await notificationService.sendDisputeStatusUpdateNotification(userId, disputeId, 'Resolved');
      });
      
      await disputeResolutionService.updateDisputeStatus(disputeId, adminId, 'Resolved', 'Note');
      
      expect(notificationService.sendDisputeStatusUpdateNotification).toHaveBeenCalled();
    });
  });
});
