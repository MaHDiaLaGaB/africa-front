// app/admin/layout.tsx
"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) router.push("/auth/login");
    else if (user.role !== "admin") router.push("/employee/dashboard");
  }, [user]);

  return (
    <div className="flex min-h-dvh bg-muted">
      {/* Sidebar */}
      <Sidebar
        role="admin"
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto">
          <div className="container-std py-4 sm:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
