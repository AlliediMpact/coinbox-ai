import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReferralNotification {
  id: string;
  type: 'new_referral' | 'commission_earned' | 'tier_upgrade';
  message: string;
  timestamp: Timestamp;
  read: boolean;
  data?: any;
}

export function useReferralNotifications(maxNotifications = 10) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ReferralNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Subscribe to notifications collection for this user
    // This query is optimized for the compound index created in firestore.indexes.json
    // See /src/lib/notification-optimization.js for more details
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('type', 'in', ['referral', 'commission']),
      orderBy('createdAt', 'desc'),
      limit(maxNotifications)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type === 'referral' ? 'new_referral' : 
                data.type === 'commission' ? 'commission_earned' : 'tier_upgrade',
          message: data.message,
          timestamp: data.createdAt,
          read: data.read || false,
          data: data.data
        } as ReferralNotification;
      });
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching referral notifications:", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user, maxNotifications]);
  
  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!user || notifications.length === 0 || isBatchUpdating) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;
    
    try {
      setIsBatchUpdating(true);
      
      // Update each unread notification using Promise.all for parallel processing
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      setIsBatchUpdating(false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setIsBatchUpdating(false);
    }
  };
  
  return { 
    notifications, 
    unreadCount, 
    isLoading, 
    isBatchUpdating,
    markAllAsRead 
  };
}
