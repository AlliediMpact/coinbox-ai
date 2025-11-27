import { describe, test, expect, vi, beforeEach } from 'vitest';
import { disputeResolutionService } from '../lib/dispute-resolution-service';
import { disputeNotificationService } from '../lib/dispute-notification-service';
import { notificationService } from '../lib/notification-service';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('firebase/firestore')>();
  
  return {
    ...originalModule,
    addDoc: vi.fn(() => Promise.resolve({ id: 'dispute-123' })),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({
      exists: () => true,
      data: () => ({
        id: 'dispute-123',
        ticketId: 'ticket-123',
        userId: 'user-123',
        counterpartyId: 'user-456',
        reason: 'Payment not received',
        description: 'I did not receive payment for this transaction',
        status: 'Open',
        evidence: [],
        comments: [],
        timeline: [
          {
            status: 'Open',
            timestamp: Timestamp.now(),
            message: 'Dispute created'
          }
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        priority: 'medium'
      })
    })),
    getDocs: vi.fn(() => Promise.resolve({
      empty: true,
      docs: []
    })),
    Timestamp: {
      now: () => ({ toDate: () => new Date() })
    },
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    arrayUnion: vi.fn(val => val)
  };
});

// Mock notification service
vi.mock('../lib/notification-service', () => ({
  notificationService: {
    createNotification: vi.fn(() => Promise.resolve()),
    notifyDispute: vi.fn(() => Promise.resolve())
  }
}));

// Mock dispute notification service
vi.mock('../lib/dispute-notification-service', () => ({
  disputeNotificationService: {
    notifyDisputeCreated: vi.fn(() => Promise.resolve()),
    notifyDisputeStatusUpdate: vi.fn(() => Promise.resolve()),
    notifyAdminNewDispute: vi.fn(() => Promise.resolve())
  }
}));

// Mock user roles
vi.mock('../lib/user-roles', () => ({
  getUsersWithRole: vi.fn(() => Promise.resolve(['admin-123']))
}));

describe('Dispute Resolution Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create a dispute', async () => {
    const disputeId = await disputeResolutionService.createDispute(
      'ticket-123',
      'user-123',
      'user-456',
      'Payment not received',
      'Detailed description of the issue'
    );

    expect(disputeId).toBe('dispute-123');
    expect(notificationService.notifyDispute).toHaveBeenCalled();
    expect(notificationService.createNotification).toHaveBeenCalled();
  });

  test('should add evidence to dispute', async () => {
    const evidenceId = await disputeResolutionService.submitEvidence(
      'dispute-123',
      'user-123',
      {
        type: 'document',
        content: 'https://example.com/evidence.pdf',
        description: 'Bank transaction proof'
      }
    );

    expect(evidenceId).toBeDefined();
    expect(notificationService.createNotification).toHaveBeenCalled();
  });

  test('should add comment to dispute', async () => {
    const commentId = await disputeResolutionService.addComment(
      'dispute-123',
      'user-123',
      'buyer',
      'I still have not received payment',
      false
    );

    expect(commentId).toBeDefined();
  });

  test('should update dispute status', async () => {
    await disputeResolutionService.updateDisputeStatus(
      'dispute-123',
      'admin-123',
      'UnderReview',
      'Admin is reviewing the dispute'
    );

    expect(disputeNotificationService.notifyDisputeStatusUpdate).toHaveBeenCalledTimes(2);
  });

  test('should resolve dispute with decision', async () => {
    await disputeResolutionService.resolveDispute(
      'dispute-123',
      'admin-123',
      {
        decision: 'buyer',
        reason: 'Buyer provided sufficient evidence'
      }
    );

    expect(disputeNotificationService.notifyDisputeStatusUpdate).toHaveBeenCalledTimes(2);
  });
});
