// components/NotificationBell.tsx
'use client';

import React, { useEffect, useState, useCallback, type ReactElement } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useWebSocket } from '@/lib/useNotifications';
import { nanoid } from 'nanoid';

interface Notification {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationBell(): ReactElement {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNewMessage = useCallback((data: any) => {
  // 1) Pick a unique ID (server-provided or client-generated)
  const id = data.id ?? crypto.randomUUID();
  const timestamp = data.timestamp ?? new Date().toISOString();

  // 2) Insert only if unseen
  setNotifications(prev => {
    // If the backend id already exists, skip
    if (prev.some(n => n.id === id)) {
      console.log('[NotificationBell] duplicate skipped', id);
      return prev;
    }

    const newNotification: Notification = {
      id,
      message: data.message,
      type: data.type || 'info',
      timestamp,
      read: false,
    };
    return [newNotification, ...prev];
  });

  // If it was genuinely new, bump unreadCount
  setUnreadCount(prev => {
    // peek into notifications to see if that id was already there
    // (you could mirror the check above or use a ref-based Set)
    return prev + 1;
  });
}, []);

  // Provide string or null to match hook signature
  useWebSocket(user?.id?.toString() ?? null, handleNewMessage);

  useEffect(() => {
    if (open) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, [open]);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'urgent':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2 rounded-full" aria-label="Notifications">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 max-h-[70vh] overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
          <span className="font-semibold">Notifications</span>
          {notifications.length > 0 && (
            <Button variant="link" size="sm" className="text-primary h-auto p-0" onClick={clearNotifications}>
              Clear All
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
          ) : (
            <ul>
              {notifications.map((notification, index) => (
                <li key={`${notification.id}-${index} `} className={`p-3 border-b hover:bg-gray-50 transition-colors ${getNotificationStyle(notification.type)}`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 h-3 w-3 rounded-full ${notification.read ? 'bg-gray-400' : 'bg-primary'}`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{notification.type}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-2 border-t bg-gray-50 text-center">
          <Button variant="link" size="sm" className="text-gray-600" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
