"use client";

import * as React from "react";
import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  description?: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New investment opportunity",
    description: "A new investment opportunity has been created.",
    read: false,
  },
  {
    id: "2",
    title: "Loan application approved",
    description: "Your loan application has been approved.",
    read: false,
  },
  {
    id: "3",
    title: "Withdrawal processed",
    description: "Your withdrawal of R100 has been processed.",
    read: true,
  },
];

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const { toast } = useToast();

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
    toast({
      title: "All notifications marked as read.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-secondary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="flex items-center justify-between border-b p-2">
          <span>Notifications</span>
          <button
            className="text-muted-foreground text-sm"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        </div>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id}>
              <div className="grid gap-1.5">
                <p className="text-sm font-semibold">{notification.title}</p>
                {notification.description && (
                  <p className="text-xs text-muted-foreground">
                    {notification.description}
                  </p>
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem>No notifications</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
