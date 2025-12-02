import { describe, it, expect, vi, beforeEach } from 'vitest';

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: any;
  updatedAt: any;
  assignedTo?: string;
  replies?: any[];
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
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
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
  },
}));

describe('Support Ticket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTicket: SupportTicket = {
    id: 'ticket123',
    userId: 'user123',
    subject: 'Test Issue',
    description: 'This is a test ticket',
    status: 'open',
    priority: 'medium',
    category: 'technical',
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  };

  describe('getAllTickets', () => {
    it('should retrieve all tickets ordered by creation date', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [
          { id: 'ticket1', data: () => mockTicket },
          { id: 'ticket2', data: () => ({ ...mockTicket, id: 'ticket2' }) },
        ],
      });

      const tickets = await supportTicketService.getAllTickets();

      expect(tickets).toHaveLength(2);
      expect(tickets[0].id).toBe('ticket1');
    });

    it('should handle empty ticket list', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({ docs: [] });

      const tickets = await supportTicketService.getAllTickets();

      expect(tickets).toEqual([]);
    });

    it('should handle Firestore errors', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(supportTicketService.getAllTickets()).rejects.toThrow(
        'Firestore error'
      );
    });
  });

  describe('getTicketsByStatus', () => {
    it('should filter tickets by open status', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'ticket1', data: () => mockTicket }],
      });

      const tickets = await supportTicketService.getTicketsByStatus('open');

      expect(tickets).toHaveLength(1);
      expect(tickets[0].status).toBe('open');
    });

    it('should filter tickets by in-progress status', async () => {
      const inProgressTicket = { ...mockTicket, status: 'in-progress' as const };

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'ticket1', data: () => inProgressTicket }],
      });

      const tickets = await supportTicketService.getTicketsByStatus(
        'in-progress'
      );

      expect(tickets).toHaveLength(1);
      expect(tickets[0].status).toBe('in-progress');
    });

    it('should filter tickets by resolved status', async () => {
      const resolvedTicket = { ...mockTicket, status: 'resolved' as const };

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'ticket1', data: () => resolvedTicket }],
      });

      const tickets = await supportTicketService.getTicketsByStatus('resolved');

      expect(tickets).toHaveLength(1);
      expect(tickets[0].status).toBe('resolved');
    });

    it('should filter tickets by closed status', async () => {
      const closedTicket = { ...mockTicket, status: 'closed' as const };

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'ticket1', data: () => closedTicket }],
      });

      const tickets = await supportTicketService.getTicketsByStatus('closed');

      expect(tickets).toHaveLength(1);
      expect(tickets[0].status).toBe('closed');
    });
  });

  describe('getAssignedTickets', () => {
    it('should retrieve tickets assigned to specific admin', async () => {
      const assignedTicket = {
        ...mockTicket,
        assignedTo: 'admin123',
        assignedToName: 'Admin User',
      };

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'ticket1', data: () => assignedTicket }],
      });

      const tickets = await supportTicketService.getAssignedTickets('admin123');

      expect(tickets).toHaveLength(1);
      expect(tickets[0].assignedTo).toBe('admin123');
    });

    it('should handle admin with no assigned tickets', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({ docs: [] });

      const tickets = await supportTicketService.getAssignedTickets('admin123');

      expect(tickets).toEqual([]);
    });
  });

  describe('getTicketById', () => {
    it('should retrieve ticket by ID', async () => {
      const { getDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        id: 'ticket123',
        data: () => mockTicket,
      });

      const ticket = await supportTicketService.getTicketById('ticket123');

      expect(ticket).toBeTruthy();
      expect(ticket?.id).toBe('ticket123');
      expect(ticket?.subject).toBe('Test Issue');
    });

    it('should return null if ticket not found', async () => {
      const { getDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => false,
      });

      const ticket = await supportTicketService.getTicketById('nonexistent');

      expect(ticket).toBeNull();
    });

    it('should handle Firestore errors', async () => {
      const { getDoc } = await import('firebase/firestore');

      (getDoc as any).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        supportTicketService.getTicketById('ticket123')
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to admin', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.assignTicket('ticket123', 'admin123', 'Admin User');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          assignedTo: 'admin123',
          assignedToName: 'Admin User',
          status: 'in-progress',
        })
      );
    });

    it('should update status to in-progress when assigned', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.assignTicket('ticket123', 'admin123', 'Admin');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'in-progress',
        })
      );
    });

    it('should handle assignment errors', async () => {
      const { updateDoc } = await import('firebase/firestore');

      (updateDoc as any).mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        supportTicketService.assignTicket('ticket123', 'admin123', 'Admin')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status to open', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.updateTicketStatus('ticket123', 'open');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'open',
        })
      );
    });

    it('should set resolvedAt when status is resolved', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.updateTicketStatus('ticket123', 'resolved');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.anything(),
        })
      );
    });

    it('should set resolvedAt when status is closed', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.updateTicketStatus('ticket123', 'closed');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'closed',
          resolvedAt: expect.anything(),
        })
      );
    });
  });

  describe('updateTicketPriority', () => {
    it('should update ticket priority to low', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.updateTicketPriority('ticket123', 'low');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          priority: 'low',
        })
      );
    });

    it('should update ticket priority to urgent', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.updateTicketPriority('ticket123', 'urgent');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          priority: 'urgent',
        })
      );
    });
  });

  describe('addReply', () => {
    it('should add reply from admin', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...mockTicket, replies: [] }),
      });

      await supportTicketService.addReply(
        'ticket123',
        'admin123',
        'Admin User',
        'This is a reply',
        true
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replies: expect.arrayContaining([
            expect.objectContaining({
              message: 'This is a reply',
              isAdmin: true,
            }),
          ]),
        })
      );
    });

    it('should add reply from user', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...mockTicket, replies: [] }),
      });

      await supportTicketService.addReply(
        'ticket123',
        'user123',
        'User Name',
        'User reply',
        false
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replies: expect.arrayContaining([
            expect.objectContaining({
              message: 'User reply',
              isAdmin: false,
            }),
          ]),
        })
      );
    });

    it('should append to existing replies', async () => {
      const existingReply = {
        id: 'reply1',
        userId: 'user1',
        userName: 'User 1',
        message: 'First reply',
        isAdmin: false,
        createdAt: { seconds: Date.now() / 1000 } as any,
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...mockTicket, replies: [existingReply] }),
      });

      await supportTicketService.addReply(
        'ticket123',
        'admin123',
        'Admin',
        'Second reply',
        true
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          replies: expect.arrayContaining([
            existingReply,
            expect.objectContaining({ message: 'Second reply' }),
          ]),
        })
      );
    });

    it('should handle ticket not found', async () => {
      const { getDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => false,
      });

      await expect(
        supportTicketService.addReply('nonexistent', 'user', 'User', 'Reply', false)
      ).rejects.toThrow('Ticket not found');
    });
  });

  describe('resolveTicket', () => {
    it('should resolve ticket with resolution note', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.resolveTicket(
        'ticket123',
        'admin123',
        'Issue fixed'
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'resolved',
          resolution: 'Issue fixed',
          resolvedBy: 'admin123',
        })
      );
    });

    it('should set resolvedAt timestamp', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.resolveTicket(
        'ticket123',
        'admin123',
        'Fixed'
      );

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          resolvedAt: expect.anything(),
        })
      );
    });
  });

  describe('getTicketStats', () => {
    it('should calculate ticket statistics correctly', async () => {
      const tickets = [
        { ...mockTicket, status: 'open', priority: 'low' },
        { ...mockTicket, id: 'ticket2', status: 'in-progress', priority: 'high' },
        { ...mockTicket, id: 'ticket3', status: 'resolved', priority: 'urgent' },
        { ...mockTicket, id: 'ticket4', status: 'closed', priority: 'medium' },
      ];

      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: tickets.map(t => ({ id: t.id, data: () => t })),
      });

      const stats = await supportTicketService.getTicketStats();

      expect(stats.total).toBe(4);
      expect(stats.open).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.resolved).toBe(1);
      expect(stats.closed).toBe(1);
      expect(stats.byPriority.urgent).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byPriority.low).toBe(1);
    });

    it('should handle empty ticket list', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({ docs: [] });

      const stats = await supportTicketService.getTicketStats();

      expect(stats.total).toBe(0);
      expect(stats.open).toBe(0);
      expect(stats.byPriority.urgent).toBe(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full ticket lifecycle', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');

      // 1. Ticket created (open)
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        id: 'ticket123',
        data: () => mockTicket,
      });

      let ticket = await supportTicketService.getTicketById('ticket123');
      expect(ticket?.status).toBe('open');

      // 2. Admin assigns ticket
      await supportTicketService.assignTicket('ticket123', 'admin123', 'Admin');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'in-progress' })
      );

      // 3. Admin adds reply
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...mockTicket, replies: [] }),
      });

      await supportTicketService.addReply(
        'ticket123',
        'admin123',
        'Admin',
        'Working on it',
        true
      );

      // 4. Admin resolves ticket
      await supportTicketService.resolveTicket('ticket123', 'admin123', 'Fixed');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: 'resolved' })
      );
    });

    it('should handle multiple concurrent ticket operations', async () => {
      const { updateDoc } = await import('firebase/firestore');

      const promises = [
        supportTicketService.assignTicket('ticket1', 'admin1', 'Admin 1'),
        supportTicketService.assignTicket('ticket2', 'admin2', 'Admin 2'),
        supportTicketService.updateTicketPriority('ticket3', 'urgent'),
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle malformed ticket data', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockResolvedValueOnce({
        docs: [{ id: 'bad', data: () => ({ invalid: 'data' }) }],
      });

      const tickets = await supportTicketService.getAllTickets();

      // Should not throw, but may have incomplete data
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should handle Firestore connection errors', async () => {
      const { getDocs } = await import('firebase/firestore');

      (getDocs as any).mockRejectedValueOnce(
        new Error('Failed to connect to Firestore')
      );

      await expect(supportTicketService.getAllTickets()).rejects.toThrow(
        'Failed to connect'
      );
    });

    it('should handle empty resolution note gracefully', async () => {
      const { updateDoc } = await import('firebase/firestore');

      await supportTicketService.resolveTicket('ticket123', 'admin123', '');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          resolution: '',
        })
      );
    });

    it('should handle very long reply messages', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');

      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...mockTicket, replies: [] }),
      });

      const longMessage = 'A'.repeat(10000);

      await supportTicketService.addReply(
        'ticket123',
        'user123',
        'User',
        longMessage,
        false
      );

      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
