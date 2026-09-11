"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RSVPButtonProps {
  eventId: string;
  initialStatus: string | null;
  counts: { going: number; maybe: number; notGoing: number };
  onUpdate?: (status: string) => void;
}

export function RSVPButton({ eventId, initialStatus, counts, onUpdate }: RSVPButtonProps) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRsvp = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, guests: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "RSVP محفوظ نہیں ہو سکا");
        return;
      }
      setStatus(newStatus);
      onUpdate?.(newStatus);
      toast.success(
        newStatus === "GOING"
          ? "شکریہ! آپ جا رہے ہیں 🎉"
          : newStatus === "MAYBE"
            ? "شاید نشان زد ہو گیا"
            : "ٹھیک ہے، آپ نہیں آ رہے"
      );
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(null);
    }
  };

  const options = [
    { value: "GOING", label: "Going", count: counts.going, icon: Check, active: "bg-emerald-600 text-white hover:bg-emerald-700" },
    { value: "MAYBE", label: "Maybe", count: counts.maybe, icon: HelpCircle, active: "bg-amber-500 text-white hover:bg-amber-600" },
    { value: "NOT_GOING", label: "Not Going", count: counts.notGoing, icon: X, active: "bg-red-500 text-white hover:bg-red-600" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={status === opt.value ? "default" : "outline"}
          className={cn(status === opt.value && opt.active)}
          onClick={() => handleRsvp(opt.value)}
          disabled={loading !== null}
          size="sm"
        >
          {loading === opt.value ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <opt.icon className="mr-1 h-3.5 w-3.5" />
          )}
          {opt.label} ({opt.count})
        </Button>
      ))}
    </div>
  );
}
