import { db } from './firebase';
import { 
  collection, 
  setDoc,
  doc as firestoreDoc,
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  serverTimestamp,
  onSnapshot, 
  deleteDoc, 
  limit, 
  writeBatch,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { NotificationType, NotificationPriority, NotificationStatus, NotificationCategory } from './notification-constants';

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  category?: NotificationCategory;
  metadata?: {
    tradeId?: string;
    disputeId?: string;
    amount?: number;
    action?: string;
    status?: string;
    paymentId?: string;
    receiptUrl?: string;
    imageUrl?: string;
    link?: string;
    expiresAt?: Timestamp;
  };
  createdAt: Timestamp;
  readAt?: Timestamp;
  deliveredVia?: ('app' | 'email' | 'push' | 'sms')[];
}

class NotificationService {
  // Event listeners for real-time notification updates
  private listeners: Map<string, () => void> = new Map();
  private fcmToken: string | null = null;
  
  /**
   * Creates a new notification and delivers it through specified channels
   */
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) {
    const now = Timestamp.now();
    
    // Add category based on type if not provided
    if (!notification.category && notification.type) {
      const { NOTIFICATION_CATEGORY_MAP } = await import('./notification-constants');
      notification.category = NOTIFICATION_CATEGORY_MAP[notification.type];
    }
    
    // Create the notification document
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      status: 'unread',
      createdAt: now,
      deliveredVia: ['app'] // Default delivery method
    });
    
    // Attempt to deliver via push notification if available
    this.deliverViaPush(notification, notificationRef.id);
    
    return notificationRef;
  }

  /**
   * Attempts to deliver notification via push notifications
   */
  private async deliverViaPush(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>, notificationId: string) {
    try {
      // Only attempt push delivery in browser environment
      if (typeof window !== 'undefined') {
        // Initialize messaging if not already done
        const messaging = getMessaging();
        
        // Get or request notification permission
        if (!this.fcmToken) {
          const currentToken = await getToken(messaging);
          if (currentToken) {
            this.fcmToken = currentToken;
            // Store token to user profile
            this.saveUserFcmToken(notification.userId, currentToken);
          }
        }
        
        // Mark notification as delivered via push if successful
        if (this.fcmToken) {
          await updateDoc(doc(db, 'notifications', notificationId), {
            deliveredVia: ['app', 'push']
          });
        }
      }
    } catch (error) {
      console.error('Failed to deliver push notification:', error);
      // Failure to deliver push should not affect other operations
    }
  }
  
  /**
   * Save user's FCM token for future push notifications
   */
  private async saveUserFcmToken(userId: string, token: string) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: {
          [token]: true
        }
      });
    } catch (error) {
      console.error('Failed to save FCM token:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'read',
      readAt: Timestamp.now()
    });
  }
  
  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string) {
    const batch = writeBatch(db);
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('status', '==', 'unread')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const now = Timestamp.now();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'read',
        readAt: now
      });
    });
    
    await batch.commit();
  }
  
  /**
   * Archive a notification
   */
  async archiveNotification(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'archived'
    });
  }
  
  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    await deleteDoc(doc(db, 'notifications', notificationId));
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

  /**
   * Subscribe to real-time notification updates for a user
   * 
   * @param userId User ID to subscribe to notifications for
   * @param callback Function to call when notifications change
   * @param options Filter options
   * @returns Unsubscribe function
   */
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void, options: {
    status?: NotificationStatus | NotificationStatus[];
    category?: NotificationCategory;
    limit?: number;
  } = {}) {
    // Create a unique identifier for this subscription
    const subscriptionId = `${userId}_${Date.now()}`;
    
    // Build query based on options
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    // Add status filter if provided
    if (options.status) {
      if (Array.isArray(options.status)) {
        if (options.status.length === 1) {
          q = query(q, where('status', '==', options.status[0]));
        }
        // For multiple status values, we'll filter in memory since Firebase doesn't support OR queries
      } else {
        q = query(q, where('status', '==', options.status));
      }
    }
    
    // Add category filter if provided
    if (options.category && options.category !== 'all') {
      q = query(q, where('category', '==', options.category));
    }
    
    // Add limit if provided
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    // Create the snapshot listener
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const notifications = snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as Notification));
        
        // Apply in-memory filtering for complex status arrays
        const filteredNotifications = options.status && Array.isArray(options.status) && options.status.length > 1
          ? notifications.filter(notification => 
              options.status!.includes(notification.status as NotificationStatus)
            )
          : notifications;
        
        callback(filteredNotifications);
      }, 
      (err) => {
        console.error('Error in notification subscription:', err);
      }
    );
    
    // Store the unsubscribe function
    this.listeners.set(subscriptionId, unsubscribe);
    
    // Return function to unsubscribe
    return () => {
      unsubscribe();
      this.listeners.delete(subscriptionId);
    };
  }
  
  /**
   * Get unread notification count for a user
   * 
   * @param userId User ID to get count for
   * @param callback Function to call when count changes
   * @returns Unsubscribe function
   */
  subscribeToUnreadCount(userId: string, callback: (count: number) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('status', '==', 'unread')
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        callback(snapshot.docs.length);
      }, 
      (err) => {
        console.error('Error in unread count subscription:', err);
        callback(0); // Default to 0 on error
      }
    );
    
    return unsubscribe;
  }
  
  /**
   * Clean up expired notifications 
   * 
   * @param userId User to clean notifications for
   * @param olderThanDays Number of days after which to consider notifications expired
   */
  async cleanupExpiredNotifications(userId: string, olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
      
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('createdAt', '<', cutoffTimestamp),
        where('status', 'in', ['read', 'archived'])
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.docs.length === 0) return;
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnapshot => {
        batch.delete(doc(db, 'notifications', docSnapshot.id));
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Failed to cleanup notifications:', err);
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

  // Dispute-specific notification methods
  async sendDisputeCreatedNotification(userId: string, disputeId: string, ticketId: string) {
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

  async sendDisputeStatusUpdateNotification(userId: string, disputeId: string, status: string, resolution?: string) {
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
        message = 'Your dispute has been resolved in your favor.';
        priority = 'high';
        break;
      case 'Rejected':
        title = 'Dispute Rejected';
        message = 'Your dispute claim has been rejected.';
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

  async sendAdminDisputeNotification(adminIds: string[], disputeId: string, ticketId: string) {
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

  // Send system alert for admin notifications
  async sendSystemAlert(alertData: {
    type: string;
    message: string;
    error?: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Log the alert
      console.error('System Alert:', alertData);
      
      // Save to database for admin review
      await addDoc(collection(db, 'system_alerts'), {
        ...alertData,
        createdAt: Timestamp.fromDate(alertData.timestamp),
        resolved: false
      });
      
      // In a real implementation, you might also:
      // - Send email to admin
      // - Send Slack notification
      // - Trigger monitoring alerts
    } catch (error) {
      console.error('Failed to send system alert:', error);
    }
  }
}

export const notificationService = new NotificationService();