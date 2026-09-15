"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2, Calendar, Heart, Briefcase, Users, BookOpen, Info, Gift, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { relativeTimeEn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  event_reminder: Calendar,
  event_invite: Gift,
  rsvp_update: MessageCircle,
  rishta_request: Heart,
  rishta_accepted: Heart,
  job_application: Briefcase,
  clan_update: Users,
  memory_tag: BookOpen,
  system: Info,
};

const typeColors: Record<string, string> = {
  event_reminder: "bg-emerald-50 text-emerald-600",
  event_invite: "bg-amber-50 text-amber-600",
  rsvp_update: "bg-blue-50 text-blue-600",
  rishta_request: "bg-pink-50 text-pink-600",
  rishta_accepted: "bg-pink-50 text-pink-600",
  job_application: "bg-amber-50 text-amber-600",
  clan_update: "bg-blue-50 text-blue-600",
  memory_tag: "bg-purple-50 text-purple-600",
  system: "bg-gray-100 text-gray-600",
};

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20", tab });
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/notifications?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "اطلاعات لوڈ نہیں ہو سکیں");
          return;
        }
        setItems((prev) => (replace ? data.notifications : [...prev, ...data.notifications]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    },
    [tab]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success("Sab notifications read ho gayin");
      fetchNotifications();
    } catch {
      toast.error("Network error");
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success("Sab notifications delete ho gayin");
      fetchNotifications();
    } catch {
      toast.error("Network error");
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        titleUrdu="اطلاعات"
        description="آپ کی تمام اپ ڈیٹس"
        actions={
          <>
            <Button variant="outline" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark All as Read
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تمام اطلاعات ڈیلیٹ کریں؟</AlertDialogTitle>
                  <AlertDialogDescription>یہ کارروائی واپس نہیں ہو سکتی۔</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={clearAll}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="event_reminder">Events</TabsTrigger>
          <TabsTrigger value="event_invite">Invites — دعوتیں</TabsTrigger>
          <TabsTrigger value="rishta_request">Rishta</TabsTrigger>
          <TabsTrigger value="job_application">Jobs</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading && items.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={<Bell className="h-12 w-12" />} title="کوئی اطلاع نہیں ہے 🔔" description="نئی اطلاعات یہاں آئیں گی" />
          ) : (
            <>
              <Card>
                <CardContent className="divide-y p-0">
                  {items.map((n) => {
                    const Icon = typeIcons[n.type] || Info;
                    return (
                      <Link
                        key={n.id}
                        href={n.link || "#"}
                        onClick={() => !n.isRead && markRead(n.id)}
                        className="flex items-start gap-3 p-4 transition-colors hover:bg-gray-50"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${typeColors[n.type] || "bg-gray-100 text-gray-600"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{n.title}</span>
                            {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                          </div>
                          <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                          <span className="mt-1 block text-xs text-gray-400">{relativeTimeEn(n.createdAt)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
              <Pagination
                hasMore={hasMore}
                isLoading={loading}
                onNext={() => nextCursor && fetchNotifications(nextCursor, false)}
                onPrev={() => fetchNotifications(undefined, true)}
              />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
