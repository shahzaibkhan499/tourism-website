"use client";

import Link from "next/link";
import { Bell, Calendar, Heart, Briefcase, Users, BookOpen, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notification";
import { relativeTimeEn } from "@/lib/utils";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  event_reminder: Calendar,
  rishta_request: Heart,
  rishta_accepted: Heart,
  job_application: Briefcase,
  clan_update: Users,
  memory_tag: BookOpen,
  system: Info,
};

export function NotificationBell() {
  const { notifications, unreadCount, loading } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && <span className="text-xs font-normal text-gray-500">{unreadCount} unread</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Load ho raha hai...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">Koi notification nahi hai 🔔</div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <DropdownMenuItem key={n.id} asChild>
                <Link href={n.link || "/notifications"} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {n.title}
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500 line-clamp-2">{n.message}</span>
                    <span className="mt-0.5 block text-[10px] text-gray-400">{relativeTimeEn(n.createdAt)}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-center text-sm font-medium text-emerald-600">
            View All
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
