'use client';

import React, { useState, useMemo } from 'react';
import { useReferralNotifications } from '@/hooks/use-referral-notifications';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export function ReferralNotifier() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, isLoading, isBatchUpdating, markAllAsRead } = useReferralNotifications(5);
  const [open, setOpen] = useState(false);
  
  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'new_referral') {
      router.push('/dashboard/referral?tab=referrals');
    } else if (notification.type === 'commission_earned') {
      router.push('/dashboard/referral?tab=commissions');
    } else {
      router.push('/dashboard/referral');
    }
    
    setOpen(false);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp.toDate?.() || timestamp);
    return format(date, 'MMM d, h:mm a');
  };
  
  // Performance optimization: memoize processed notifications
  const processedNotifications = useMemo(() => {
    return notifications.map(notification => ({
      ...notification,
      formattedTime: formatTimestamp(notification.timestamp),
      displayType: notification.type === 'new_referral' 
        ? 'New Referral' 
        : notification.type === 'commission_earned' 
          ? 'Commission Earned' 
          : 'Tier Update'
    }));
  }, [notifications]);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Referral Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="text-center py-4">
            <span className="text-sm text-muted-foreground">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4">
            <span className="text-sm text-muted-foreground">No notifications yet</span>
          </div>
        ) : (
          <DropdownMenuGroup>
            {processedNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${notification.read ? '' : 'bg-muted/50 font-medium'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      {notification.displayType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {notification.formattedTime}
                    </span>
                  </div>
                  <span className="text-sm mt-1">{notification.message}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        {unreadCount > 0 && (
          <DropdownMenuItem 
            className="justify-center text-primary font-medium"
            onClick={markAllAsRead}
            disabled={isBatchUpdating}
          >
            {isBatchUpdating ? 'Marking as read...' : 'Mark All as Read'}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          className="justify-center font-medium"
          onClick={() => router.push('/dashboard/referral')}
        >
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
