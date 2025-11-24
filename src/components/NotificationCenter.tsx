import React, { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
    Bell, 
    CheckCircle2, 
    AlertCircle, 
    Info, 
    UserPlus,
    ShieldCheck,
    ArrowDownToLine,
    Check,
    Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { colors } from "@/styles/designTokens";

interface Notification {
    id: string;
    type: 'transaction' | 'system' | 'kyc' | 'referral' | 'security';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    priority?: 'low' | 'medium' | 'high';
    actionUrl?: string;
    actionLabel?: string;
}

// Animation variants
const bellVariants: Variants = {
  idle: { 
    rotate: 0 
  },
  ringing: {
    rotate: [0, 15, -15, 10, -10, 5, -5, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatDelay: 5
    }
  }
};

const dropdownVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: -5
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      duration: 0.3,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: {
      duration: 0.2
    }
  }
};

const notificationItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 20
    }
  }
};

const badgeVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  pulse: {
    scale: [1, 1.2, 1],
    boxShadow: [
      "0 0 0 0 rgba(239, 68, 68, 0)",
      "0 0 0 8px rgba(239, 68, 68, 0.2)",
      "0 0 0 0 rgba(239, 68, 68, 0)"
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatDelay: 3
    }
  }
};

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'transaction',
    title: 'Transaction Completed',
    message: 'Your transfer of R350.00 to John D. has been completed successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    read: false,
    priority: 'medium'
  },
  {
    id: '2',
    type: 'kyc',
    title: 'KYC Verification Update',
    message: 'Your identity verification has been approved. You now have full account access.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    priority: 'high',
    actionUrl: '/dashboard/kyc',
    actionLabel: 'View Details'
  },
  {
    id: '3',
    type: 'referral',
    title: 'New Referral Signup',
    message: 'Sarah T. has signed up using your referral code. Earn commission when they complete transactions.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    read: true,
    priority: 'medium',
    actionUrl: '/dashboard/referral',
    actionLabel: 'View Referrals'
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on May 25th from 01:00-03:00 UTC. Some services may be unavailable.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    priority: 'low'
  },
  {
    id: '5',
    type: 'security',
    title: 'Security Alert',
    message: 'A new device was used to log into your account. Please verify this was you.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
    read: false,
    priority: 'high',
    actionUrl: '/dashboard/security',
    actionLabel: 'Review Activity'
  }
];

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Effect to handle new notification arrival simulation
    useEffect(() => {
        // Simulate new notification arriving
        const timer = setTimeout(() => {
            if (unreadCount > 0) {
                setHasNewNotifications(true);
                
                // Reset the flag after animation completes
                setTimeout(() => {
                    setHasNewNotifications(false);
                }, 1000);
            }
        }, 5000);
        
        return () => clearTimeout(timer);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(notification => 
            notification.id === id ? { ...notification, read: true } : notification
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    };
    
    // Get notification icon based on type
    const getNotificationIcon = (type: string, priority?: string) => {
        switch (type) {
            case 'transaction':
                return <ArrowDownToLine className="h-5 w-5 text-primary" />;
            case 'kyc':
                return <ShieldCheck className="h-5 w-5 text-primary" />;
            case 'referral':
                return <UserPlus className="h-5 w-5 text-primary" />;
            case 'security':
                return <AlertCircle className={`h-5 w-5 ${priority === 'high' ? 'text-status-error' : 'text-primary'}`} />;
            default:
                return <Info className="h-5 w-5 text-primary" />;
        }
    };
    
    // Format relative time
    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        
        return "just now";
    };
    
    // Group notifications by date
    const groupedNotifications = notifications.reduce((acc, notification) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);
        const notificationDate = new Date(notification.timestamp).setHours(0, 0, 0, 0);
        
        let groupKey;
        if (notificationDate === today) {
            groupKey = "Today";
        } else if (notificationDate === yesterday) {
            groupKey = "Yesterday";
        } else {
            groupKey = "Earlier";
        }
        
        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(notification);
        return acc;
    }, {} as Record<string, Notification[]>);

    return (
        <DropdownMenu onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <motion.div 
                    className="relative inline-flex" 
                    animate={(unreadCount > 0 && !isOpen) || hasNewNotifications ? "ringing" : "idle"}
                    variants={bellVariants}
                >
                    <Button variant="ghost" size="icon" className="relative overflow-visible">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <AnimatePresence>
                            {unreadCount > 0 && (
                                <motion.div
                                    initial="initial"
                                    animate={["animate", hasNewNotifications ? "pulse" : null]}
                                    exit={{ scale: 0, opacity: 0 }}
                                    variants={badgeVariants}
                                    className="absolute -top-1 -right-1"
                                >
                                    <Badge 
                                        variant="destructive" 
                                        className="h-5 w-5 flex items-center justify-center rounded-full p-0 border-2 border-white shadow-sm"
                                    >
                                        {unreadCount}
                                    </Badge>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </motion.div>
            </DropdownMenuTrigger>
            
            <AnimatePresence>
                {isOpen && (
                    <DropdownMenuContent 
                        align="end" 
                        className="w-[340px] p-0 overflow-hidden"
                        asChild
                        forceMount
                    >
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={dropdownVariants}
                        >
                            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                                <h3 className="font-medium text-sm flex items-center">
                                    <Bell className="h-4 w-4 mr-2 text-primary" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none">
                                            {unreadCount} new
                                        </Badge>
                                    )}
                                </h3>
                                
                                {unreadCount > 0 && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={markAllAsRead}
                                        className="text-xs h-7 px-2 hover:text-primary transition-colors"
                                    >
                                        <Check className="h-3 w-3 mr-1" />
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                            
                            <div className="max-h-[420px] overflow-auto divide-y divide-neutral-100 scrollbar-thin">
                                {notifications.length === 0 ? (
                                    <motion.div 
                                        variants={notificationItemVariants}
                                        className="py-8 px-4 text-center"
                                    >
                                        <div className="mx-auto w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mb-3">
                                            <Bell className="h-5 w-5 text-neutral-300" />
                                        </div>
                                        <p className="text-sm font-medium text-neutral-700">No notifications</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            You&apos;re all caught up! We&apos;ll notify you when something needs your attention.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <>
                                        {Object.entries(groupedNotifications).map(([date, items]) => (
                                            <div key={date}>
                                                <div className="sticky top-0 px-3 py-1.5 bg-neutral-50 border-y text-xs font-medium text-neutral-500 z-10">
                                                    {date}
                                                </div>
                                                
                                                {items.map((notification, index) => (
                                                    <motion.div
                                                        key={notification.id}
                                                        variants={notificationItemVariants}
                                                        custom={index}
                                                        className={`p-3 group hover:bg-neutral-50 transition-colors ${
                                                            !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                                                        }`}
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-0.5 p-2 rounded-full bg-primary/5 shrink-0 ${
                                                                notification.priority === 'high' ? 'bg-status-error/10' : 'bg-primary/5'
                                                            }`}>
                                                                {getNotificationIcon(notification.type, notification.priority)}
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-primary' : ''}`}>
                                                                        {notification.title}
                                                                    </h4>
                                                                    <div className="flex items-center shrink-0">
                                                                        {!notification.read && (
                                                                            <span className="w-2 h-2 rounded-full bg-status-info mr-1.5"></span>
                                                                        )}
                                                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                                                            {formatTimeAgo(notification.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                    {notification.message}
                                                                </p>
                                                                
                                                                {notification.actionLabel && (
                                                                    <div className="mt-2 text-right">
                                                                        <a 
                                                                            href={notification.actionUrl}
                                                                            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                                                                        >
                                                                            {notification.actionLabel}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                            
                            <DropdownMenuSeparator />
                            <div className="p-2 text-center">
                                <Button variant="ghost" size="sm" className="text-xs w-full text-primary hover:bg-primary/5">
                                    <Clock className="h-3 w-3 mr-1" />
                                    View all notifications
                                </Button>
                            </div>
                        </motion.div>
                    </DropdownMenuContent>
                )}
            </AnimatePresence>
        </DropdownMenu>
    );
}