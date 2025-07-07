"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FiMenu } from "react-icons/fi";
import NotificationBell from "@/components/layout/NotificationBell";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
      {onToggleSidebar && (
        <button className="md:hidden mr-2" onClick={onToggleSidebar}>
          <FiMenu className="h-6 w-6" />
        </button>
      )}

      <h1 className="text-lg font-semibold">
        {user?.role === "admin" ? "لوحة المدير" : "لوحة الموظف"}
      </h1>

      {user && (
        <div className="flex items-center gap-4">
          {/* ← put the bell here */}
          <NotificationBell />

          <span className="text-sm text-muted-foreground">
            {user.username}
          </span>
          <Button variant="destructive" onClick={handleLogout}>
            تسجيل الخروج
          </Button>
        </div>
      )}
    </header>
  );
}
