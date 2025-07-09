"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
// import NotificationBell from "../layout/NotificationBell";
// import { NotificationsProvider } from "@/components/layout/NotificationsProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
      // <NotificationsProvider>
    <AuthProvider>
        {children}
    </AuthProvider>
      // </NotificationsProvider>
  );
}
