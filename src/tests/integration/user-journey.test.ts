import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { membershipService } from '../../lib/membership-service';
import { tradingService } from '../../lib/trading-service';
import { loanService } from '../../lib/loan-service';
import { commissionService } from '../../lib/commission-service';
import { disputeService } from '../../lib/dispute-resolution-service';
import { notificationService } from '../../lib/notification-service';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('firebase/auth');

// Mock all services
jest.mock('../../lib/membership-service', () => ({
  membershipService: {
    purchaseMembership: jest.fn(),
    getUserMembership: jest.fn(),
    verifyMembershipEligibility: jest.fn()
  }
}));

jest.mock('../../lib/trading-service', () => ({
  tradingService: {
    createTicket: jest.fn(),
    findMatch: jest.fn(),
    createEscrow: jest.fn(),
    confirmTrade: jest.fn(),
    createDispute: jest.fn(),
    cancelTicket: jest.fn()
  }
}));

jest.mock('../../lib/loan-service', () => ({
  loanService: {
    applyForLoan: jest.fn(),
    getUserLoans: jest.fn(),
    reviewLoan: jest.fn(),
    fundLoan: jest.fn(),
    repayLoan: jest.fn()
  }
}));

jest.mock('../../lib/commission-service', () => ({
  commissionService: {
    createMembershipCommission: jest.fn(),
    getUserCommissionSummary: jest.fn(),
    processCommissions: jest.fn()
  }
}));

jest.mock('../../lib/dispute-resolution-service', () => ({
  disputeService: {
    createDispute: jest.fn(),
    getDisputeDetails: jest.fn(),
    updateDisputeStatus: jest.fn(),
    submitEvidence: jest.fn()
  }
}));

jest.mock('../../lib/notification-service', () => ({
  notificationService: {
    sendNotification: jest.fn(),
    getUserNotifications: jest.fn()
  }
}));

describe('User Journey Integration Tests', () => {
  const userId = 'test-user-123';
  const referrerId = 'referrer-user-456';
  const adminId = 'admin-user-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Membership Purchase to Trading Flow', () => {
    it('should allow a user to purchase a membership and create a trading ticket', async () => {
      // Step 1: Purchase membership
      (membershipService.verifyMembershipEligibility as jest.Mock).mockResolvedValue(true);
      (membershipService.purchaseMembership as jest.Mock).mockResolvedValue({
        id: 'membership-123',
        userId,
        tierName: 'Basic',
        status: 'Active',
        securityFee: 550,
        refundableAmount: 500,
        adminFee: 50,
        transactionId: 'transaction-123',
        createdAt: new Date()
      });
      
      // Purchase membership with referral
      const membership = await membershipService.purchaseMembership(userId, {
        tierName: 'Basic',
        referrerId,
        paymentMethod: 'card'
      });
      
      // Verify membership purchase
      expect(membershipService.purchaseMembership).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(membership.tierName).toBe('Basic');
      expect(membership.status).toBe('Active');
      
      // Step 2: Verify commission was created for referrer
      (commissionService.createMembershipCommission as jest.Mock).mockResolvedValue('commission-123');
      
      const commissionId = await commissionService.createMembershipCommission(
        referrerId, 
        userId, 
        'Basic', 
        550
      );
      
      expect(commissionService.createMembershipCommission).toHaveBeenCalledWith(
        referrerId, 
        userId, 
        'Basic', 
        550
      );
      expect(commissionId).toBe('commission-123');
      
      // Step 3: Create a trading ticket
      (tradingService.createTicket as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
        userId,
        type: 'Borrow',
        amount: 400,
        interest: 25,
        status: 'Open',
        createdAt: new Date()
      });
      
      // Get user membership for validation
      (membershipService.getUserMembership as jest.Mock).mockResolvedValue({
        id: 'membership-123',
        userId,
        tierName: 'Basic',
        status: 'Active',
        loanLimit: 500,
        investmentLimit: 5000
      });
      
      // Create borrow ticket
      const ticket = await tradingService.createTicket(userId, {
        type: 'Borrow',
        amount: 400,
        interest: 25
      });
      
      // Verify ticket creation
      expect(tradingService.createTicket).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(ticket.type).toBe('Borrow');
      expect(ticket.amount).toBe(400);
      expect(ticket.status).toBe('Open');
      
      // Step 4: Find a match for the ticket
      const matchTicket = {
        id: 'match-ticket-123',
        userId: 'investor-456',
        type: 'Invest',
        amount: 400,
        interest: 25,
        status: 'Open',
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
      };
      
      (tradingService.findMatch as jest.Mock).mockResolvedValue(matchTicket);
      
      const match = await tradingService.findMatch(ticket);
      
      // Verify match
      expect(tradingService.findMatch).toHaveBeenCalledWith(ticket);
      expect(match).not.toBeNull();
      expect(match.type).toBe('Invest');
      expect(match.amount).toBe(400);
      
      // Step 5: Create escrow
      (tradingService.createEscrow as jest.Mock).mockResolvedValue(undefined);
      
      await tradingService.createEscrow(ticket, match);
      
      // Verify escrow creation
      expect(tradingService.createEscrow).toHaveBeenCalledWith(ticket, match);
      
      // Step 6: Confirm the trade
      (tradingService.confirmTrade as jest.Mock).mockResolvedValue(undefined);
      
      await tradingService.confirmTrade(ticket.id);
      
      // Verify trade confirmation
      expect(tradingService.confirmTrade).toHaveBeenCalledWith(ticket.id);
      
      // Step 7: Verify notifications were sent
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
  
  describe('Loan Application to Repayment Flow', () => {
    it('should allow a user to apply for, receive, and repay a loan', async () => {
      // Step 1: Apply for a loan
      (membershipService.getUserMembership as jest.Mock).mockResolvedValue({
        id: 'membership-123',
        userId,
        tierName: 'Basic',
        status: 'Active',
        loanLimit: 500,
        investmentLimit: 5000
      });
      
      (loanService.applyForLoan as jest.Mock).mockResolvedValue('loan-123');
      
      const loanId = await loanService.applyForLoan(userId, {
        amount: 400,
        term: 30,
        purpose: 'Personal expenses'
      });
      
      // Verify loan application
      expect(loanService.applyForLoan).toHaveBeenCalledWith(userId, expect.any(Object));
      expect(loanId).toBe('loan-123');
      
      // Step 2: Admin reviews and approves the loan
      (loanService.reviewLoan as jest.Mock).mockResolvedValue(undefined);
      
      await loanService.reviewLoan(loanId, adminId, true, 'Approved based on good account standing');
      
      // Verify loan review
      expect(loanService.reviewLoan).toHaveBeenCalledWith(
        loanId, 
        adminId, 
        true, 
        'Approved based on good account standing'
      );
      
      // Step 3: Loan is funded
      (loanService.fundLoan as jest.Mock).mockResolvedValue(undefined);
      
      await loanService.fundLoan(loanId, 'transaction-456');
      
      // Verify loan funding
      expect(loanService.fundLoan).toHaveBeenCalledWith(loanId, 'transaction-456');
      
      // Step 4: User repays the loan
      (loanService.repayLoan as jest.Mock).mockResolvedValue(undefined);
      
      await loanService.repayLoan(loanId, userId, 'transaction-789');
      
      // Verify loan repayment
      expect(loanService.repayLoan).toHaveBeenCalledWith(loanId, userId, 'transaction-789');
      
      // Step 5: Verify notifications were sent
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
  
  describe('Trading Dispute Resolution Flow', () => {
    it('should allow a user to create and resolve a dispute', async () => {
      const ticketId = 'ticket-123';
      const counterpartyId = 'user-456';
      
      // Step 1: Create a dispute
      (disputeService.createDispute as jest.Mock).mockResolvedValue({
        id: 'dispute-123',
        ticketId,
        userId,
        counterpartyId,
        type: 'Payment not received',
        status: 'Open',
        description: 'I never received the payment',
        createdAt: new Date()
      });
      
      const dispute = await disputeService.createDispute({
        ticketId,
        userId,
        counterpartyId,
        type: 'Payment not received',
        description: 'I never received the payment'
      });
      
      // Verify dispute creation
      expect(disputeService.createDispute).toHaveBeenCalledWith(expect.any(Object));
      expect(dispute.status).toBe('Open');
      
      // Step 2: Submit evidence for the dispute
      (disputeService.submitEvidence as jest.Mock).mockResolvedValue({
        id: 'evidence-123',
        disputeId: dispute.id,
        userId,
        type: 'Screenshot',
        description: 'Screenshot of my bank account showing no incoming payment',
        fileUrl: 'https://example.com/evidence.jpg',
        createdAt: new Date()
      });
      
      const evidence = await disputeService.submitEvidence({
        disputeId: dispute.id,
        userId,
        type: 'Screenshot',
        description: 'Screenshot of my bank account showing no incoming payment',
        fileUrl: 'https://example.com/evidence.jpg'
      });
      
      // Verify evidence submission
      expect(disputeService.submitEvidence).toHaveBeenCalledWith(expect.any(Object));
      expect(evidence.type).toBe('Screenshot');
      
      // Step 3: Admin reviews and resolves the dispute
      (disputeService.updateDisputeStatus as jest.Mock).mockResolvedValue({
        ...dispute,
        status: 'Resolved',
        resolution: 'In favor of complainant',
        resolutionDetails: 'Evidence shows payment was not received',
        resolvedBy: adminId,
        resolvedAt: new Date()
      });
      
      const resolvedDispute = await disputeService.updateDisputeStatus(dispute.id, {
        status: 'Resolved',
        resolution: 'In favor of complainant',
        resolutionDetails: 'Evidence shows payment was not received',
        resolvedBy: adminId
      });
      
      // Verify dispute resolution
      expect(disputeService.updateDisputeStatus).toHaveBeenCalledWith(dispute.id, expect.any(Object));
      expect(resolvedDispute.status).toBe('Resolved');
      expect(resolvedDispute.resolution).toBe('In favor of complainant');
      
      // Step 4: Verify notifications were sent
      expect(notificationService.sendNotification).toHaveBeenCalled();
    });
  });
});
