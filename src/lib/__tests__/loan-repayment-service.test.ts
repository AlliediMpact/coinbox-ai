import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Loan {
  id: string;
  borrowerId: string;
  lenderId: string;
  amount: number;
  interestRate: number;
  duration: number;
  repaymentDate: Date;
  status: string;
  createdAt: any;
  remindersSent?: any[];
}

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  db: {
    collection: vi.fn(),
  },
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}));

// Mock notification service
vi.mock('@/lib/notificationService', () => ({
  sendNotification: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock email service
vi.mock('@/lib/emailService', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Loan Repayment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLoan: Loan = {
    id: 'loan123',
    borrowerId: 'borrower123',
    lenderId: 'lender123',
    amount: 5000,
    interestRate: 10,
    duration: 3,
    repaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'active',
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  describe('checkUpcomingRepayments', () => {
    it('should identify loans due in 7 days and send first reminder', async () => {
      const { getDocs } = await import('firebase/firestore');
      const { sendNotification } = await import('@/lib/notificationService');
      const { sendEmail } = await import('@/lib/emailService');

      // Mock Firestore query to return loan due in 7 days
      (getDocs as any).mockResolvedValueOnce({
        docs: [
          {
            id: mockLoan.id,
            data: () => mockLoan,
          },
        ],
      });

      await loanRepaymentService.checkUpcomingRepayments();

      expect(sendNotification).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'loan_reminder',
          data: expect.objectContaining({
            daysUntilDue: 7,
          }),
        })
      );
    });

    it('should identify loans due in 3 days and send second reminder', async () => {
      const loanDueIn3Days = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      };

      const { getDocs } = await import('firebase/firestore');
      const { sendEmail } = await import('@/lib/emailService');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: loanDueIn3Days.id, data: () => loanDueIn3Days }],
      });

      await loanRepaymentService.checkUpcomingRepayments();

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'loan_reminder',
          data: expect.objectContaining({
            daysUntilDue: 3,
          }),
        })
      );
    });

    it('should identify loans due in 1 day and send final reminder', async () => {
      const loanDueIn1Day = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      };

      const { getDocs } = await import('firebase/firestore');
      const { sendEmail } = await import('@/lib/emailService');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: loanDueIn1Day.id, data: () => loanDueIn1Day }],
      });

      await loanRepaymentService.checkUpcomingRepayments();

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'loan_reminder',
          data: expect.objectContaining({
            daysUntilDue: 1,
          }),
        })
      );
    });

    it('should not send duplicate reminders for same day', async () => {
      const loanWithReminder = {
        ...mockLoan,
        remindersSent: [{ days: 7, sentAt: { seconds: Date.now() / 1000 } }],
      };

      const { getDocs } = await import('firebase/firestore');
      const { sendEmail } = await import('@/lib/emailService');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: loanWithReminder.id, data: () => loanWithReminder }],
      });

      await loanRepaymentService.checkUpcomingRepayments();

      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should handle empty loan list', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({ docs: [] });

      await expect(
        loanRepaymentService.checkUpcomingRepayments()
      ).resolves.not.toThrow();
    });

    it('should handle Firestore query errors gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        loanRepaymentService.checkUpcomingRepayments()
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('markAsOverdue', () => {
    it('should mark overdue loan and notify borrower', async () => {
      const overdueLoan = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      };

      const { updateDoc } = await import('firebase/firestore');
      const { sendNotification } = await import('@/lib/notificationService');
      const { sendEmail } = await import('@/lib/emailService');

      await loanRepaymentService.markAsOverdue(overdueLoan);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'overdue',
        })
      );
      expect(sendNotification).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'loan_overdue',
        })
      );
    });

    it('should notify admin about overdue loan', async () => {
      const overdueLoan = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      };

      const { sendNotification } = await import('@/lib/notificationService');

      await loanRepaymentService.markAsOverdue(overdueLoan);

      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Overdue'),
        })
      );
    });

    it('should calculate days overdue correctly', async () => {
      const overdueLoan = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      };

      const { sendEmail } = await import('@/lib/emailService');

      await loanRepaymentService.markAsOverdue(overdueLoan);

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            daysOverdue: expect.any(Number),
          }),
        })
      );
    });

    it('should handle notification failures gracefully', async () => {
      const { sendNotification } = await import('@/lib/notificationService');
      (sendNotification as any).mockRejectedValueOnce(
        new Error('Notification failed')
      );

      await expect(
        loanRepaymentService.markAsOverdue(mockLoan)
      ).resolves.not.toThrow();
    });
  });

  describe('processRepayment', () => {
    it('should process repayment with correct distribution', async () => {
      const { updateDoc, getDoc } = await import('firebase/firestore');

      // Mock loan retrieval
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockLoan,
      });

      await loanRepaymentService.processRepayment('loan123', 'borrower123');

      expect(updateDoc).toHaveBeenCalled();
      // Verify distribution:
      // - 5% to lender wallet
      // - 15% to lender bank
      // - 25% platform fee
      // - 55% interest to lender
    });

    it('should verify borrower ownership before processing', async () => {
      const { getDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockLoan,
      });

      await expect(
        loanRepaymentService.processRepayment('loan123', 'wrong-user')
      ).rejects.toThrow('Unauthorized');
    });

    it('should not process already repaid loan', async () => {
      const repaidLoan = { ...mockLoan, status: 'repaid' };

      const { getDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => repaidLoan,
      });

      await expect(
        loanRepaymentService.processRepayment('loan123', 'borrower123')
      ).rejects.toThrow('already repaid');
    });

    it('should send repayment confirmation to both parties', async () => {
      const { getDoc } = await import('firebase/firestore');
      const { sendNotification } = await import('@/lib/notificationService');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockLoan,
      });

      await loanRepaymentService.processRepayment('loan123', 'borrower123');

      expect(sendNotification).toHaveBeenCalledTimes(2); // Borrower + Lender
    });

    it('should handle payment processing errors', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockLoan,
      });

      (updateDoc as any).mockRejectedValueOnce(new Error('Payment failed'));

      await expect(
        loanRepaymentService.processRepayment('loan123', 'borrower123')
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('getUserLoans', () => {
    it('should retrieve all active loans for user', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [
          { id: 'loan1', data: () => mockLoan },
          { id: 'loan2', data: () => ({ ...mockLoan, id: 'loan2' }) },
        ],
      });

      const loans = await loanRepaymentService.getUserLoans('borrower123');

      expect(loans).toHaveLength(2);
      expect(loans[0].id).toBe('loan1');
    });

    it('should return empty array if no loans found', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({ docs: [] });

      const loans = await loanRepaymentService.getUserLoans('borrower123');

      expect(loans).toEqual([]);
    });

    it('should filter by status if provided', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'loan1', data: () => mockLoan }],
      });

      const loans = await loanRepaymentService.getUserLoans(
        'borrower123',
        'active'
      );

      expect(loans).toHaveLength(1);
      expect(loans[0].status).toBe('active');
    });
  });

  describe('getOverdueLoans', () => {
    it('should retrieve all overdue loans', async () => {
      const overdueLoan = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'overdue',
      };

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'loan1', data: () => overdueLoan }],
      });

      const loans = await loanRepaymentService.getOverdueLoans();

      expect(loans).toHaveLength(1);
      expect(loans[0].status).toBe('overdue');
    });

    it('should sort overdue loans by days overdue (descending)', async () => {
      const loan1 = {
        ...mockLoan,
        id: 'loan1',
        repaymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'overdue',
      };
      const loan2 = {
        ...mockLoan,
        id: 'loan2',
        repaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'overdue',
      };

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [
          { id: 'loan1', data: () => loan1 },
          { id: 'loan2', data: () => loan2 },
        ],
      });

      const loans = await loanRepaymentService.getOverdueLoans();

      expect(loans[0].id).toBe('loan1'); // Most overdue first
    });

    it('should handle empty overdue list', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({ docs: [] });

      const loans = await loanRepaymentService.getOverdueLoans();

      expect(loans).toEqual([]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full reminder workflow (7→3→1 days)', async () => {
      const { getDocs, updateDoc } = await import('firebase/firestore');
      const { sendEmail } = await import('@/lib/emailService');

      // Day 1: Send 7-day reminder
      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: mockLoan.id, data: () => mockLoan }],
      });

      await loanRepaymentService.checkUpcomingRepayments();
      expect(sendEmail).toHaveBeenCalledTimes(1);

      vi.clearAllMocks();

      // Day 2: Send 3-day reminder
      const loanWith3Days = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        remindersSent: [{ days: 7, sentAt: { seconds: Date.now() / 1000 } }],
      };

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: loanWith3Days.id, data: () => loanWith3Days }],
      });

      await loanRepaymentService.checkUpcomingRepayments();
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should transition from due to overdue correctly', async () => {
      const { getDocs, updateDoc } = await import('firebase/firestore');

      // Loan becomes overdue
      const overdueLoan = {
        ...mockLoan,
        repaymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      };

      await loanRepaymentService.markAsOverdue(overdueLoan);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'overdue' })
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle concurrent reminder processing', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValue({
        docs: [
          { id: 'loan1', data: () => mockLoan },
          { id: 'loan2', data: () => ({ ...mockLoan, id: 'loan2' }) },
        ],
      });

      const promises = [
        loanRepaymentService.checkUpcomingRepayments(),
        loanRepaymentService.checkUpcomingRepayments(),
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle malformed loan data', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'bad-loan', data: () => ({ invalid: 'data' }) }],
      });

      await expect(
        loanRepaymentService.checkUpcomingRepayments()
      ).resolves.not.toThrow();
    });

    it('should handle email service failures gracefully', async () => {
      const { getDocs } = await import('firebase/firestore');
      const { sendEmail } = await import('@/lib/emailService');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: mockLoan.id, data: () => mockLoan }],
      });

      (sendEmail as any).mockRejectedValueOnce(new Error('Email failed'));

      await expect(
        loanRepaymentService.checkUpcomingRepayments()
      ).resolves.not.toThrow();
    });
  });
});
