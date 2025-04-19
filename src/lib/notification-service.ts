import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

export interface Notification {
  id?: string;
  userId: string;
  type: 'trade_match' | 'dispute' | 'escrow_release' | 'commission' | 'kyc_status' | 'system';
  title: string;
  message: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high';
  metadata?: {
    tradeId?: string;
    disputeId?: string;
    amount?: number;
    action?: string;
  };
  createdAt: Timestamp;
  readAt?: Timestamp;
}

class NotificationService {
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) {
    const now = Timestamp.now();
    return await addDoc(collection(db, 'notifications'), {
      ...notification,
      status: 'unread',
      createdAt: now
    });
  }

  async markAsRead(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'read',
      readAt: Timestamp.now()
    });
  }

  async getNotifications(userId: string, options: {
    status?: 'unread' | 'read',
    limit?: number,
    type?: Notification['type']
  } = {}) {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }

      if (options.type) {
        q = query(q, where('type', '==', options.type));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async notifyTradeMatch(userId: string, tradeId: string, amount: number) {
    return this.createNotification({
      userId,
      type: 'trade_match',
      title: 'Trade Match Found',
      message: `A matching trade for R${amount} has been found and funds are now in escrow.`,
      priority: 'high',
      metadata: {
        tradeId,
        amount,
        action: 'view_trade'
      }
    });
  }

  async notifyDispute(userId: string, disputeId: string, tradeId: string) {
    return this.createNotification({
      userId,
      type: 'dispute',
      title: 'Trade Dispute Opened',
      message: 'A dispute has been opened for your trade. Please respond within 24 hours.',
      priority: 'high',
      metadata: {
        disputeId,
        tradeId,
        action: 'view_dispute'
      }
    });
  }

  async notifyEscrowRelease(userId: string, tradeId: string, amount: number) {
    return this.createNotification({
      userId,
      type: 'escrow_release',
      title: 'Escrow Released',
      message: `R${amount} has been released from escrow and transferred to your wallet.`,
      priority: 'medium',
      metadata: {
        tradeId,
        amount,
        action: 'view_transaction'
      }
    });
  }

  async notifyCommission(userId: string, amount: number) {
    return this.createNotification({
      userId,
      type: 'commission',
      title: 'Commission Earned',
      message: `You've earned a commission of R${amount} from a successful referral.`,
      priority: 'medium',
      metadata: {
        amount,
        action: 'view_commissions'
      }
    });
  }

  async notifyKycStatus(userId: string, status: 'approved' | 'rejected' | 'pending_review') {
    const messages = {
      approved: 'Your KYC verification has been approved. You can now trade on the platform.',
      rejected: 'Your KYC verification was not approved. Please check the requirements and try again.',
      pending_review: 'Your KYC documents have been received and are under review.'
    };

    return this.createNotification({
      userId,
      type: 'kyc_status',
      title: 'KYC Status Update',
      message: messages[status],
      priority: status === 'approved' ? 'high' : 'medium',
      metadata: {
        action: 'view_kyc'
      }
    });
  }
}

export const notificationService = new NotificationService();