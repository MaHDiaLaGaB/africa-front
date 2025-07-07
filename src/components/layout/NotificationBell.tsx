"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNotificationsContext } from "./NotificationsProvider";

export default function NotificationBell() {
  const { notifications, markAllRead } = useNotificationsContext();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-6 w-6" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 rounded-full h-4 w-4 text-xs flex items-center justify-center text-white">
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-2 border-b flex justify-between items-center">
          <span className="font-semibold">الإشعارات</span>
          <Button variant="link" size="sm" onClick={markAllRead}>
            مسح الكل
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-2 hover:bg-muted">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(n.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
