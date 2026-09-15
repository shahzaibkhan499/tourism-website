"use client";

/**
 * Round 10 — RSVP modal with suggested Quick Messages / Duas (Fix 4).
 * Opens when the user clicks Accept / Going / Condole on a digital card.
 * The user can tap a chip (Arabic / Urdu / English) or type a custom message.
 */

import { useEffect, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getSuggestedDuas, isCondolenceEvent } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RsvpDuaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventType: string;
  status: "GOING" | "MAYBE" | "NOT_GOING";
  currentMessage?: string | null;
  onSent: (status: string, message: string) => void;
}

export function RsvpDuaModal({
  open,
  onOpenChange,
  eventId,
  eventType,
  status,
  currentMessage,
  onSent,
}: RsvpDuaModalProps) {
  const [message, setMessage] = useState("");
  const [guests, setGuests] = useState(1);
  const [sending, setSending] = useState(false);
  const duas = getSuggestedDuas(eventType);
  const condolence = isCondolenceEvent(eventType);

  useEffect(() => {
    if (open) {
      setMessage(currentMessage ?? "");
      setGuests(1);
    }
  }, [open, currentMessage]);

  const title =
    status === "GOING"
      ? condolence
        ? "تعزیت — Condolence"
        : "شکریہ — آپ جا رہے ہیں"
      : status === "MAYBE"
        ? "شاید — Maybe"
        : "معذرت — Not Going";

  const send = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, guests, message: message.trim() || null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "RSVP محفوظ نہیں ہو سکا");
        return;
      }
      onSent(status, message.trim());
      onOpenChange(false);
      toast.success(
        status === "GOING"
          ? condolence
            ? "آپ کی تعزیت پہنچ گئی — آپ کے الفاظ منتقل ہو گئے 🤲"
            : "شکریہ! آپ جا رہے ہیں 🎉"
          : "آپ کا جواب محفوظ ہو گیا"
      );
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              {condolence
                ? "دعا منتخب کریں یا اپنی تعزیتی بات لکھیں — Choose a dua or write your condolences"
                : "مبارکباد / دعا منتخب کریں یا اپنا پیغام لکھیں — Pick a quick message or write your own"}
            </p>
            <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
              {duas.map((d) => {
                const chipText = [d.ar ?? "", d.ur ?? ""].filter(Boolean).join(" ");
                const selected = message === chipText || message === (d.ar ?? d.ur ?? "");
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setMessage(chipText)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                      selected
                        ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300"
                        : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                    )}
                  >
                    <span className="mt-0.5 text-lg" aria-hidden>
                      {d.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      {d.ar && (
                        <span dir="rtl" className="block text-base font-semibold leading-relaxed text-gray-800">
                          {d.ar}
                        </span>
                      )}
                      {d.ur && (
                        <span dir="rtl" className="block text-sm leading-relaxed text-gray-700">
                          {d.ur}
                        </span>
                      )}
                      {d.en && <span className="mt-0.5 block text-xs italic text-gray-400">{d.en}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">مہمان — Guests</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setGuests((g) => Math.max(1, g - 1))}>
                  −
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{guests}</span>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setGuests((g) => Math.min(50, g + 1))}>
                  +
                </Button>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-sm font-medium text-gray-700">پیغام — Message (custom)</p>
              <Textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="یہاں اپنا پیغام لکھیں..."
                className="resize-none text-sm"
              />
            </div>
          </div>

          <Button
            onClick={send}
            disabled={sending}
            className={cn("w-full", status === "GOING" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-800 hover:bg-gray-900")}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {sending ? "بھیجا جا رہا ہے..." : "جواب بھیجیں — Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
