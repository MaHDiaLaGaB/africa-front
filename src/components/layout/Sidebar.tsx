// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiActivity,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiLogOut,
  FiUserPlus,
  FiX,
  FiUser
} from "react-icons/fi";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "admin" | "employee";
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const links = role === "admin"
    ? [
        { href: "/admin/dashboard", label: "لوحة المدير", icon: <FiHome /> },
        { href: "/admin/currencies", label: "العملات", icon: <FiDollarSign /> },
        { href: "/admin/services", label: "الخدمات", icon: <FiActivity /> },
        { href: "/admin/customers", label: "العملاء", icon: <FiUser /> },
        { href: "/admin/employee", label: "اضافة موظف", icon: <FiUserPlus /> },
        { href: "/admin/transactions", label: "الحوالات", icon: <FiActivity /> },
        { href: "/admin/reports", label: "التقارير", icon: <FiFileText /> },
      ]
    : [
        { href: "/employee/dashboard", label: "لوحة التحكم", icon: <FiHome /> },
        { href: "/employee/transactions", label: "الحوالات", icon: <FiActivity /> },
        { href: "/employee/customers", label: "العملاء", icon: <FiUsers /> },
        { href: "/employee/receipts", label: "أوامر القبض", icon: <FiFileText /> },
      ];

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        dir="rtl"
        className={cn(
          "fixed inset-y-0 right-0 z-30 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto transform transition-transform duration-200",
          isOpen ? "translate-x-0" : "translate-x-full",
          "md:relative md:translate-x-0 md:z-auto"
        )}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            شركتي
          </Link>
          <button
            className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          {links.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex flex-row-reverse items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-md transition",
                  "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                  isActive
                    ? "bg-gray-100 text-blue-600 font-semibold border-r-4 border-blue-500 dark:bg-gray-700 dark:text-blue-400"
                    : ""
                )}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { /* handle logout */ }}
            className="w-full flex flex-row-reverse items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-700 dark:text-red-400 transition"
          >
            <FiLogOut className="text-lg" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
