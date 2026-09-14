"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  BookOpen,
  Bell,
  CalendarPlus,
  Heart,
  Briefcase,
  BookPlus,
  ArrowRight,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, relativeTimeEn, initials } from "@/lib/utils";
import { getEventTypeInfo } from "@/lib/constants";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
    clan: { name: string; nameUrdu: string | null; memberCount: number } | null;
  };
  stats: {
    eventsCreated: number;
    clanMembers: number;
    memoriesCount: number;
    unreadNotifications: number;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    location: string | null;
    creatorName: string | null;
    rsvpCount: number;
  }>;
  activities: Array<{
    id: string;
    type: "event" | "memory" | "media";
    title: string;
    createdAt: string;
    link: string;
  }>;
}

const quickActions = [
  { label: "ایونٹ بنائیں", href: "/events/create", icon: CalendarPlus, color: "bg-emerald-100 text-emerald-700" },
  { label: "رشتہ دیکھیں", href: "/rishta", icon: Heart, color: "bg-pink-100 text-pink-700" },
  { label: "Job Search", href: "/jobs", icon: Briefcase, color: "bg-amber-100 text-amber-700" },
  { label: "یاد شامل کریں", href: "/memories/create", icon: BookPlus, color: "bg-purple-100 text-purple-700" },
];

export function DashboardContent({ user, stats, upcomingEvents, activities }: DashboardProps) {
  // Record the login in the audit log (device/browser/OS) once per sign-in
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("dk-login-flag") === "1") {
        window.sessionStorage.removeItem("dk-login-flag");
        fetch("/api/auth/login-log", { method: "POST" }).catch(() => {
          // Login history is best-effort; never block the dashboard
        });
      }
    } catch {
      // sessionStorage may be unavailable (private mode) — ignore
    }
  }, []);

  const statCards = [
    { label: "بنائے گئے ایونٹس", value: stats.eventsCreated, icon: CalendarDays, color: "bg-emerald-100 text-emerald-700" },
    { label: "کلان ممبران", value: stats.clanMembers, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "محفوظ یادیں", value: stats.memoriesCount, icon: BookOpen, color: "bg-purple-100 text-purple-700" },
    { label: "غیر پڑھی اطلاعیں", value: stats.unreadNotifications, icon: Bell, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-white/40">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-white/20 text-white">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="flex flex-wrap items-center gap-x-2 text-xl font-bold" dir="ltr">
                <span>Assalam-o-Alaikum, {user.name.split(" ")[0]}!</span>
                <span className="text-emerald-100" aria-hidden>—</span>
                <span className="font-urdu" dir="rtl">السلام علیکم، {user.name.split(" ")[0]}</span>
              </h2>
              <p className="mt-0.5 text-sm text-emerald-100">
                {formatDate(new Date())} ·{" "}
                {user.clan ? (
                  <>
                    Clan: <strong>{user.clan.name}</strong>
                  </>
                ) : (
                  "ابھی کسی کلان سے نہیں جڑے"
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" asChild>
            <Link href="/profile">پروفائل دیکھیں</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 text-center transition-all hover:border-emerald-200 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.color} transition-transform group-hover:scale-110`}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming events */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Events</CardTitle>
            <Link href="/events" className="flex items-center text-xs font-medium text-emerald-600 hover:underline">
              سب دیکھیں <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                کوئی آنے والا ایونٹ نہیں ہے۔
                <Link href="/events/create" className="mt-1 block font-medium text-emerald-600 hover:underline">
                  Pehla event banayein →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const info = getEventTypeInfo(event.type);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50">
                        <span className="text-xs font-bold text-emerald-700">
                          {new Date(event.date).getDate()}
                        </span>
                        <span className="text-[10px] uppercase text-emerald-600">
                          {new Date(event.date).toLocaleString("en", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{event.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {info.emoji} {info.labelUrdu}
                          </Badge>
                          {event.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-emerald-700">{event.rsvpCount} going</div>
                        <ChevronRight className="ml-auto mt-1 h-4 w-4 text-gray-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                ابھی کوئی سرگرمی نہیں ہے۔ پلیٹ فارم دریافت کریں!
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((a) => (
                  <Link key={a.id} href={a.link} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        a.type === "event"
                          ? "bg-emerald-50 text-emerald-600"
                          : a.type === "memory"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {a.type === "event" ? (
                        <CalendarDays className="h-4 w-4" />
                      ) : a.type === "memory" ? (
                        <BookOpen className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-800">{a.title}</div>
                      <div className="text-xs text-gray-400">{relativeTimeEn(a.createdAt)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
