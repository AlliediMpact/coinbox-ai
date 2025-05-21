import { getFirestore, collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";

interface DisputeNotification {
  userId: string;
  disputeId: string;
  ticketId: string;
  status?: string;
  resolution?: string;
}

export class DisputeNotificationService {
  private db = getFirestore();
  
  async notifyDisputeCreated(data: DisputeNotification) {
    const { userId, disputeId, ticketId } = data;
    
    return this.createNotification({
      userId,
      type: 'dispute',
      title: 'Dispute Filed',
      message: 'Your dispute has been successfully filed and will be reviewed by our team.',
      priority: 'medium',
      metadata: {
        disputeId,
        tradeId: ticketId,
        action: 'created'
      }
    });
  }

  async notifyDisputeStatusUpdate(data: DisputeNotification) {
    const { userId, disputeId, status, resolution } = data;
    
    let title: string;
    let message: string;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    switch (status) {
      case 'UnderReview':
        title = 'Dispute Under Review';
        message = 'Your dispute is now being reviewed by our support team.';
        break;
      case 'Resolved':
        title = 'Dispute Resolved';
        message = resolution || 'Your dispute has been resolved in your favor.';
        priority = 'high';
        break;
      case 'Rejected':
        title = 'Dispute Rejected';
        message = resolution || 'Your dispute claim has been rejected.';
        priority = 'high';
        break;
      default:
        title = 'Dispute Update';
        message = `The status of your dispute has been updated to: ${status}`;
    }
    
    return this.createNotification({
      userId,
      type: 'dispute_update',
      title,
      message,
      priority,
      metadata: {
        disputeId,
        action: 'update',
        status
      }
    });
  }

  async notifyAdminNewDispute(adminIds: string[], disputeId: string, ticketId: string) {
    const notificationPromises = adminIds.map(adminId => 
      this.createNotification({
        userId: adminId,
        type: 'dispute',
        title: 'New Dispute Filed',
        message: 'A new user dispute requires your attention.',
        priority: 'high',
        metadata: {
          disputeId,
          tradeId: ticketId,
          action: 'admin_review'
        }
      })
    );
    
    return Promise.all(notificationPromises);
  }

  private async createNotification(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    metadata?: any;
  }) {
    const now = Timestamp.now();
    return await addDoc(collection(this.db, 'notifications'), {
      ...notification,
      status: 'unread',
      createdAt: now
    });
  }
}

// Export a singleton instance
export const disputeNotificationService = new DisputeNotificationService();
