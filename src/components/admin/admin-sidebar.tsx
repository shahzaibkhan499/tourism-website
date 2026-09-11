"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { APP_NAME } from "@/lib/constants";
import {
  LayoutDashboard,
  Users,
  Network,
  CalendarDays,
  Flag,
  Building2,
  Heart,
  Briefcase,
  Camera,
  Settings,
  ScrollText,
  Mail,
  Shield,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/clans", label: "Clans", icon: Network },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/rishta", label: "Rishta", icon: Heart },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/media", label: "Media", icon: Camera },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/contact", label: "Contact Messages", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-gray-900 text-gray-300 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Admin Panel</div>
          <div className="text-[10px] text-gray-500">{APP_NAME}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-emerald-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-gray-800 p-3">
        <Link
          href="/dashboard"
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <LayoutDashboard className="h-[18px] w-[18px]" />
          User Dashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/30"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  );
}
