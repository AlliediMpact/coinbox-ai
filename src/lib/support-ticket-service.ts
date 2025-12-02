import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string; // Admin user ID
  assignedToName?: string;
  assignedAt?: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
  resolution?: string;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  userId: string;
  userName: string;
  message: string;
  isAdmin: boolean;
  createdAt: Timestamp;
}

export interface TicketStats {
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

class SupportTicketService {
  private ticketsCollection = 'support_tickets';

  /**
   * Get all support tickets (admin only)
   */
  async getAllTickets(): Promise<SupportTicket[]> {
    try {
      const ticketsRef = collection(db, this.ticketsCollection);
      const q = query(ticketsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupportTicket[];
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      throw error;
    }
  }

  /**
   * Get tickets by status
   */
  async getTicketsByStatus(
    status: 'open' | 'in-progress' | 'resolved' | 'closed'
  ): Promise<SupportTicket[]> {
    try {
      const ticketsRef = collection(db, this.ticketsCollection);
      const q = query(
        ticketsRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupportTicket[];
    } catch (error) {
      console.error(`Error fetching ${status} tickets:`, error);
      throw error;
    }
  }

  /**
   * Get tickets assigned to a specific admin
   */
  async getAssignedTickets(adminUserId: string): Promise<SupportTicket[]> {
    try {
      const ticketsRef = collection(db, this.ticketsCollection);
      const q = query(
        ticketsRef,
        where('assignedTo', '==', adminUserId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupportTicket[];
    } catch (error) {
      console.error('Error fetching assigned tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        return null;
      }

      return {
        id: ticketSnap.id,
        ...ticketSnap.data(),
      } as SupportTicket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  }

  /**
   * Assign ticket to admin
   */
  async assignTicket(
    ticketId: string,
    adminUserId: string,
    adminName: string
  ): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      await updateDoc(ticketRef, {
        assignedTo: adminUserId,
        assignedToName: adminName,
        assignedAt: Timestamp.now(),
        status: 'in-progress',
        updatedAt: Timestamp.now(),
      });

      console.log(`Ticket ${ticketId} assigned to ${adminName}`);
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in-progress' | 'resolved' | 'closed'
  ): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = Timestamp.now();
      }

      await updateDoc(ticketRef, updateData);
      console.log(`Ticket ${ticketId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  /**
   * Update ticket priority
   */
  async updateTicketPriority(
    ticketId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      await updateDoc(ticketRef, {
        priority,
        updatedAt: Timestamp.now(),
      });

      console.log(`Ticket ${ticketId} priority updated to ${priority}`);
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      throw error;
    }
  }

  /**
   * Add reply to ticket
   */
  async addReply(
    ticketId: string,
    userId: string,
    userName: string,
    message: string,
    isAdmin: boolean
  ): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      const ticket = await this.getTicketById(ticketId);

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const newReply: TicketReply = {
        id: Date.now().toString(),
        userId,
        userName,
        message,
        isAdmin,
        createdAt: Timestamp.now(),
      };

      const replies = ticket.replies || [];
      replies.push(newReply);

      await updateDoc(ticketRef, {
        replies,
        updatedAt: Timestamp.now(),
      });

      console.log(`Reply added to ticket ${ticketId}`);
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }

  /**
   * Resolve ticket with resolution note
   */
  async resolveTicket(
    ticketId: string,
    adminUserId: string,
    resolution: string
  ): Promise<void> {
    try {
      const ticketRef = doc(db, this.ticketsCollection, ticketId);
      await updateDoc(ticketRef, {
        status: 'resolved',
        resolution,
        resolvedBy: adminUserId,
        resolvedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(`Ticket ${ticketId} resolved`);
    } catch (error) {
      console.error('Error resolving ticket:', error);
      throw error;
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    try {
      const tickets = await this.getAllTickets();

      const stats: TicketStats = {
        total: tickets.length,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        byPriority: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      };

      tickets.forEach((ticket) => {
        // Count by status
        switch (ticket.status) {
          case 'open':
            stats.open++;
            break;
          case 'in-progress':
            stats.inProgress++;
            break;
          case 'resolved':
            stats.resolved++;
            break;
          case 'closed':
            stats.closed++;
            break;
        }

        // Count by priority
        switch (ticket.priority) {
          case 'urgent':
            stats.byPriority.urgent++;
            break;
          case 'high':
            stats.byPriority.high++;
            break;
          case 'medium':
            stats.byPriority.medium++;
            break;
          case 'low':
            stats.byPriority.low++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error calculating ticket stats:', error);
      throw error;
    }
  }
}

export const supportTicketService = new SupportTicketService();
