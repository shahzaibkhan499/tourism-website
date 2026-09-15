"use client";

/**
 * Round 10 — Digital invitation card page.
 * Invitees land here from the notification; it renders the themed
 * DigitalInviteCard for the event.
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalInviteCard, getCardPageStyle } from "@/components/events/digital-invite-card";

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

  // Round 12 (Fix 2) — the page wrapper hugs the card: it centers the card in
  // a themed background that fills the visible viewport (header 4rem + main
  // padding 2rem/3rem), so there is no blank void below the card.
  const pageStyle = event ? getCardPageStyle(event.type) : { backgroundColor: "#f3f4f6" };
  const pageClasses =
    "flex min-h-[calc(100dvh-6rem)] w-full flex-col items-center justify-center rounded-2xl lg:min-h-[calc(100dvh-7rem)]";

  if (loading) {
    return (
      <div className={pageClasses} style={pageStyle}>
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <Skeleton className="h-10 w-1/2 rounded-xl" />
          <Skeleton className="h-[480px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={pageClasses} style={pageStyle}>
        <div className="flex flex-col items-center justify-center text-center">
          <Ban className="mb-4 h-10 w-10 text-gray-400" />
          <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-200">دعوت نامہ دستیاب نہیں</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error === "FORBIDDEN"
              ? "Aap is event mein mad'u nahi hain ya event delete ho chuka hai."
              : "Card load nahi ho saka. Creator se rabta karein."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClasses} style={pageStyle}>
      <div className="flex w-full flex-col items-center justify-center px-1 py-4 sm:px-2">
        <DigitalInviteCard event={event} onRsvpUpdate={load} />
      </div>
    </div>
  );
}
