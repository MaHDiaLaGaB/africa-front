"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { NotificationsProvider } from "@/components/layout/NotificationsProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </AuthProvider>
  );
}
