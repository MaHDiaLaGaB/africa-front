// app/components/layout.tsx
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
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container-std flex items-center justify-between gap-3 py-2 sm:py-3">
        {onToggleSidebar && (
          <button
            className="md:hidden -mr-1 rounded p-2 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2"
            onClick={onToggleSidebar}
            aria-label="فتح القائمة"
          >
            <FiMenu className="h-6 w-6" />
          </button>
        )}

        <h1 className="text-base sm:text-lg font-semibold truncate">
          {user?.role === "admin" ? "لوحة المدير" : "لوحة الموظف"}
        </h1>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <span className="hidden sm:inline-block max-w-[10rem] md:max-w-[16rem] truncate text-sm text-muted-foreground">
              {user.username}
            </span>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="h-9 px-3"
            >
              تسجيل الخروج
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
