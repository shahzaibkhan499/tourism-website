"use client";

/**
 * Round 10 — Digital invitation card page.
 * Invitees land here from the notification; it renders the themed
 * DigitalInviteCard for the event.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalInviteCard } from "@/components/events/digital-invite-card";

interface InviteEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  hijriDate: string | null;
  description: string | null;
  coverImage: string | null;
  details: Record<string, any> | null;
  creator: { id: string; name: string | null; image: string | null };
  counts: { going: number; maybe: number; notGoing: number };
  myRsvp: { status: string; guests: number; note: string | null; message: string | null } | null;
}

export default function InviteCardPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<InviteEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setEvent(data);
      })
      .catch(() => setError("Card load nahi ho saka"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-1/2 rounded-xl" />
        <Skeleton className="h-[480px] w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Ban className="mb-4 h-10 w-10 text-gray-300" />
        <h1 className="text-lg font-semibold text-gray-700">دعوت نامہ دستیاب نہیں</h1>
        <p className="mt-1 text-sm text-gray-400">
          {error === "FORBIDDEN"
            ? "Aap is event mein mad'u nahi hain ya event delete ho chuka hai."
            : "Card load nahi ho saka. Creator se rabta karein."}
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <DigitalInviteCard event={event} onRsvpUpdate={load} />
    </div>
  );
}
