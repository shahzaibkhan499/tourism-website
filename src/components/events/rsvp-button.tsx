"use client";

import { useState } from "react";
import { Check, X, HelpCircle, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCondolenceEvent } from "@/lib/constants";
import { RsvpDuaModal } from "./rsvp-dua-modal";

interface RSVPButtonProps {
  eventId: string;
  eventType?: string;
  initialStatus: string | null;
  initialMessage?: string | null;
  counts: { going: number; maybe: number; notGoing: number };
  onUpdate?: (status: string, message: string) => void;
}

/**
 * Round 10 — clicking Accept / Going (or Condole on death events) opens
 * the suggested-messages / Duas modal; the RSVP + message are sent together.
 */
export function RSVPButton({
  eventId,
  eventType,
  initialStatus,
  initialMessage,
  counts,
  onUpdate,
}: RSVPButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);
  const [pending, setPending] = useState<"GOING" | "MAYBE" | "NOT_GOING" | null>(null);
  const condolence = eventType ? isCondolenceEvent(eventType) : false;

  const options = [
    {
      value: "GOING" as const,
      label: condolence ? "Condole — تعزیت" : "Going / Accept",
      count: counts.going,
      icon: condolence ? HeartHandshake : Check,
      active: "bg-emerald-600 text-white hover:bg-emerald-700",
    },
    {
      value: "MAYBE" as const,
      label: "Maybe",
      count: counts.maybe,
      icon: HelpCircle,
      active: "bg-amber-500 text-white hover:bg-amber-600",
    },
    {
      value: "NOT_GOING" as const,
      label: "Not Going",
      count: counts.notGoing,
      icon: X,
      active: "bg-red-500 text-white hover:bg-red-600",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={status === opt.value ? "default" : "outline"}
            className={cn(status === opt.value && opt.active)}
            onClick={() => setPending(opt.value)}
            size="sm"
          >
            <opt.icon className="mr-1 h-3.5 w-3.5" />
            {opt.label} ({opt.count})
          </Button>
        ))}
      </div>
      {pending && (
        <RsvpDuaModal
          open={pending !== null}
          onOpenChange={(o) => !o && setPending(null)}
          eventId={eventId}
          eventType={eventType ?? ""}
          status={pending}
          currentMessage={message}
          onSent={(s, m) => {
            setStatus(s);
            setMessage(m || null);
            setPending(null);
            onUpdate?.(s, m);
          }}
        />
      )}
    </>
  );
}
