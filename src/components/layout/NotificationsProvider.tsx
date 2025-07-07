"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useNotifications as useWsNotifications } from "@/lib/useNotifications";

export type Notification = {
  id: string;
  type: string;
  content: string;
  timestamp: number;
};

type NotificationsContextType = {
  notifications: Notification[];
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // subscribe to WebSocket notifications
  useWsNotifications((msg) => {
    setNotifications((prev) => [
      { id: Date.now().toString(), ...msg, timestamp: Date.now() },
      ...prev,
    ]);
  });

  const markAllRead = () => setNotifications([]);

  return (
    <NotificationsContext.Provider value={{ notifications, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotificationsContext must be used within NotificationsProvider");
  return ctx;
}