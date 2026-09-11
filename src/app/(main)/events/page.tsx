"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, CalendarDays, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { EVENT_TYPES } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import type { EventItem } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const debouncedLocation = useDebounce(location);

  const fetchEvents = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "12" });
        if (type !== "all") params.set("type", type);
        if (debouncedLocation) params.set("location", debouncedLocation);
        if (visibility !== "all") params.set("isPublic", visibility);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/events?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "ایونٹس لوڈ نہیں ہو سکے");
          return;
        }
        setEvents((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
      } finally {
        setLoading(false);
      }
    },
    [type, debouncedLocation, visibility]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div>
      <PageHeader
        title="Events"
        titleUrdu="تقریبات"
        description="فیملی ایونٹس بنائیں، دیکھیں اور RSVP کریں"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/events/create">
              <Plus className="mr-1 h-4 w-4" />
              نیا ایونٹ بنائیں
            </Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="mr-1 h-3.5 w-3.5" />
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">تمام اقسام</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.emoji} {t.label} — {t.labelUrdu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="مقام تلاش کریں..."
            className="pl-9"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sab</SelectItem>
            <SelectItem value="true">Public</SelectItem>
            <SelectItem value="false">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event grid */}
      {loading && events.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-white">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="کوئی ڈیٹا نہیں ملا"
          description="ابھی کوئی ایونٹ نہیں ہے۔ پہلا ایونٹ بنائیں!"
          actionLabel="ایونٹ بنائیں"
          actionHref="/events/create"
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination
            hasMore={hasMore}
            isLoading={loading}
            onNext={() => nextCursor && fetchEvents(nextCursor, false)}
            onPrev={() => fetchEvents(undefined, true)}
          />
        </>
      )}
    </div>
  );
}
