import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/lib/notification-service';
import { useAuth } from '@/components/AuthProvider';
import { NotificationCategory, NotificationStatus } from '@/lib/notification-constants';

interface NotificationFilterOptions {
  status?: NotificationStatus | NotificationStatus[];
  category?: NotificationCategory;
  limit?: number;
}

export function useNotifications(options: NotificationFilterOptions = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Subscribe to notifications
  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeCount: (() => void) | null = null;
    
    const subscribeToNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Subscribe to notifications with filters
        unsubscribeNotifications = notificationService.subscribeToNotifications(
          user.uid,
          (notifs) => {
            setNotifications(notifs);
            setLoading(false);
          },
          options
        );
        
        // Subscribe to unread count
        unsubscribeCount = notificationService.subscribeToUnreadCount(
          user.uid,
          (count) => setUnreadCount(count)
        );
      } catch (err) {
        console.error('Error subscribing to notifications:', err);
        setError(err instanceof Error ? err : new Error('Failed to load notifications'));
        setLoading(false);
      }
    };
    
    subscribeToNotifications();
    
    // Cleanup subscriptions when component unmounts or user changes
        unsubscribeCount();
      }
    };
  }, [user, options]);
  
  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    try {
      await notificationService.markAsRead(user.uid, notificationId);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.uid);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, [user]);

  // Archive a notification
  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.archiveNotification(notificationId);
    } catch (err) {
      console.error('Error archiving notification:', err);
      throw err;
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Cleanup expired notifications
  const cleanupExpiredNotifications = useCallback(async (olderThanDays = 30) => {
    if (!user) return;
    
    try {
      await notificationService.cleanupExpiredNotifications(user.uid, olderThanDays);
    } catch (err) {
      console.error('Error cleaning up notifications:', err);
      throw err;
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    cleanupExpiredNotifications
  };
}
