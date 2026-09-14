"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { APP_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Heart,
  Briefcase,
  Building2,
  BookOpen,
  Camera,
  User,
  Settings,
  Bell,
  Accessibility,
  Baby,
  Network,
  Shield,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notification";

interface SidebarProps {
  isAdmin?: boolean;
  mobile?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", urdu: "ڈیش بورڈ", icon: LayoutDashboard },
  { href: "/tree", label: "Family Tree", urdu: "شجرہ نسب", icon: Network },
  { href: "/events", label: "Events", urdu: "ایونٹس", icon: CalendarDays },
  { href: "/community", label: "Community", urdu: "برادری", icon: Users },
  { href: "/rishta", label: "Rishta", urdu: "رشتہ", icon: Heart },
  { href: "/jobs", label: "Jobs", urdu: "نوکریاں", icon: Briefcase },
  { href: "/business", label: "Business", urdu: "کاروبار", icon: Building2 },
  { href: "/occupation", label: "Occupation", urdu: "روزگار", icon: Briefcase },
  { href: "/memories", label: "Memories", urdu: "یادیں", icon: BookOpen },
  { href: "/media", label: "Media", urdu: "میڈیا", icon: Camera },
  { href: "/profile", label: "Profile", urdu: "پروفائل", icon: User },
  { href: "/settings", label: "Settings", urdu: "ترتیبات", icon: Settings },
  { href: "/notifications", label: "Notifications", urdu: "اطلاعات", icon: Bell },
  { href: "/buzurg", label: "Buzurg", urdu: "بزرگ", icon: Accessibility },
  { href: "/kids", label: "Kids", urdu: "بچے", icon: Baby },
];

export function Sidebar({ isAdmin, mobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-r bg-white",
        mobile ? "" : "hidden lg:flex"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt={APP_NAME} className="h-8 w-8 rounded-lg" />
          <span className="font-bold">
            {APP_NAME.split(" ")[0]}{" "}
            <span className="text-emerald-600">{APP_NAME.split(" ").slice(1).join(" ")}</span>
          </span>
        </Link>
        {mobile && (
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={mobile ? onClose : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-emerald-600" : "text-gray-400")} />
                <span className="flex flex-1 items-baseline justify-between gap-2">
                  <span>{item.label}</span>
                  <span dir="rtl" className="font-urdu text-[11px] text-gray-400">{item.urdu}</span>
                </span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={mobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Shield className={cn("h-[18px] w-[18px]", pathname.startsWith("/admin") ? "text-emerald-400" : "text-gray-400")} />
              <span dir="ltr">Switch to Admin</span>
              <span className="text-xs text-gray-500">—</span>
              <span dir="rtl">ایڈمن پر جائیں</span>
            </Link>
          )}
        </div>
      </nav>

      <div className="border-t p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
