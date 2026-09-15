"use client";

/**
 * Round 10 — Digital Invitation Card (Fix 3).
 * Opened from the invite notification. Themed by event type:
 *   SOBER       — dark/gray, Islamic geometric pattern (Death, Burial, ...)
 *   ELEGANT     — gold + floral (Marriage, Engagement, Walima, ...)
 *   CELEBRATORY — pastel + balloons/stars (Birth, Aqeeqa, ...)
 *   RELIGIOUS   — deep green + crescent (Quran Khani, Hifz, Milad, ...)
 *   ACHIEVEMENT — blue professional (Graduation, Doctorate, ...)
 *   DEFAULT     — emerald
 */

import { CalendarDays, Clock, MapPin, Navigation, User2, Sparkles, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, optimizeImageUrl } from "@/lib/utils";
import { getEventTypeInfo, getEventCardTheme, isCondolenceEvent, type EventCardTheme } from "@/lib/constants";
import { RSVPButton } from "./rsvp-button";
import { cn } from "@/lib/utils";

interface DigitalInviteCardProps {
  event: {
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
  };
  onRsvpUpdate?: () => void;
}

const THEME_STYLES: Record<
  EventCardTheme,
  {
    shell: string;
    header: string;
    title: string;
    sub: string;
    metaBg: string;
    chip: string;
    pattern?: string;
    /** Round 12 — page background (Fix 2): fills the invite page behind the
     * card so no white/gray void appears below it. */
    pageBg: string;
    pageBgColor: string;
  }
> = {
  SOBER: {
    shell: "border-gray-300 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl",
    header: "text-gray-300",
    title: "font-serif text-3xl sm:text-4xl text-white",
    sub: "text-gray-400",
    metaBg: "bg-white/5 text-gray-200 ring-white/10",
    chip: "bg-white/10 text-gray-200",
    pattern:
      "radial-gradient(circle at 25% 15%, rgba(255,255,255,0.06) 0, transparent 45%), radial-gradient(circle at 75% 85%, rgba(255,255,255,0.05) 0, transparent 45%)",
    pageBg: "linear-gradient(180deg, #111827 0%, #0a0f1a 55%, #111827 100%)",
    pageBgColor: "#0a0f1a",
  },
  ELEGANT: {
    shell: "border-amber-300/70 bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-100 text-amber-950 shadow-2xl",
    header: "text-amber-700",
    title: "font-serif text-3xl sm:text-4xl text-amber-900",
    sub: "text-amber-700/80",
    metaBg: "bg-white/70 text-amber-900 ring-amber-200",
    chip: "bg-amber-100 text-amber-800",
    pattern:
      "radial-gradient(circle at 10% 10%, rgba(217,119,6,0.10) 0, transparent 40%), radial-gradient(circle at 90% 90%, rgba(217,119,6,0.10) 0, transparent 40%)",
    pageBg: "linear-gradient(180deg, #fffbeb 0%, #fbeed0 50%, #f9e3b3 100%)",
    pageBgColor: "#fbeed0",
  },
  CELEBRATORY: {
    shell: "border-pink-200 bg-gradient-to-b from-pink-50 via-sky-50 to-amber-50 text-gray-800 shadow-2xl",
    header: "text-pink-500",
    title: "text-3xl sm:text-4xl font-extrabold text-gray-800",
    sub: "text-pink-500",
    metaBg: "bg-white/80 text-gray-700 ring-pink-100",
    chip: "bg-pink-100 text-pink-700",
    pattern:
      "radial-gradient(circle at 15% 20%, rgba(244,114,182,0.18) 0, transparent 42%), radial-gradient(circle at 85% 15%, rgba(56,189,248,0.18) 0, transparent 42%), radial-gradient(circle at 75% 85%, rgba(251,191,36,0.18) 0, transparent 42%)",
    pageBg: "linear-gradient(160deg, #fdf2f8 0%, #eff6ff 45%, #fffbeb 100%)",
    pageBgColor: "#f5f3ff",
  },
  RELIGIOUS: {
    shell: "border-emerald-300/60 bg-gradient-to-b from-emerald-900 via-emerald-950 to-green-950 text-white shadow-2xl",
    header: "text-amber-300",
    title: "font-serif text-3xl sm:text-4xl text-white",
    sub: "text-emerald-200/80",
    metaBg: "bg-white/5 text-emerald-50 ring-emerald-400/20",
    chip: "bg-emerald-400/10 text-emerald-100",
    pattern:
      "radial-gradient(circle at 20% 12%, rgba(251,191,36,0.08) 0, transparent 45%), radial-gradient(circle at 80% 88%, rgba(16,185,129,0.12) 0, transparent 45%)",
    pageBg: "linear-gradient(180deg, #022c22 0%, #064e3b 60%, #022c22 100%)",
    pageBgColor: "#022c22",
  },
  ACHIEVEMENT: {
    shell: "border-sky-300/60 bg-gradient-to-b from-sky-600 via-blue-700 to-indigo-800 text-white shadow-2xl",
    header: "text-sky-200",
    title: "text-3xl sm:text-4xl font-bold text-white",
    sub: "text-sky-100/80",
    metaBg: "bg-white/10 text-white ring-white/20",
    chip: "bg-white/15 text-white",
    pageBg: "linear-gradient(180deg, #0f2557 0%, #12306e 55%, #0c1a3a 100%)",
    pageBgColor: "#0c1a3a",
  },
  DEFAULT: {
    shell: "border-emerald-300/70 bg-gradient-to-b from-emerald-500 via-emerald-600 to-green-700 text-white shadow-2xl",
    header: "text-emerald-100",
    title: "text-3xl sm:text-4xl font-bold text-white",
    sub: "text-emerald-50/80",
    metaBg: "bg-white/10 text-white ring-white/20",
    chip: "bg-white/15 text-white",
    pageBg: "linear-gradient(180deg, #065f46 0%, #047857 55%, #064e3b 100%)",
    pageBgColor: "#064e3b",
  },
};

/** Round 12 (Fix 2) — CSS for the invite page wrapper so the themed
 * background wraps the card edge-to-edge (no blank void below). */
export function getCardPageStyle(eventType: string): React.CSSProperties {
  const t = THEME_STYLES[getEventCardTheme(eventType)];
  return {
    backgroundColor: t.pageBgColor,
    backgroundImage: t.pattern ? `${t.pageBg}, ${t.pattern}` : t.pageBg,
  };
}

const THEME_DECOR: Record<EventCardTheme, { top: string; bottom: string }> = {
  SOBER: { top: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", bottom: "إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ" },
  ELEGANT: { top: "✦ دعوتِ شادِی ✦", bottom: "✦ عروسی مبارک ہو ✦" },
  CELEBRATORY: { top: "🎈 مبارک ہو! 🎈", bottom: "⭐ خوشیاں لازوال ⭐" },
  RELIGIOUS: { top: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", bottom: "🌙 اللہ تعالیٰ آپ کی برکت فرمائے 🌙" },
  ACHIEVEMENT: { top: " Congratulations 🏆", bottom: "🎓 A proud moment for the family" },
  DEFAULT: { top: "🎉 You are invited 🎉", bottom: "✨ آپ کا انتظار ہے ✨" },
};

function findMapLink(details: Record<string, any> | null): string | null {
  if (!details) return null;
  const candidates: string[] = [];
  for (const v of Object.values(details)) {
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (
          (k === "mapLink" || k === "googleMapLink") &&
          typeof val === "string" &&
          /^https?:\/\//.test(val)
        ) {
          candidates.push(val);
        }
      }
    }
  }
  if (candidates.length > 0) return candidates[0];
  return null;
}

export function DigitalInviteCard({ event, onRsvpUpdate }: DigitalInviteCardProps) {
  const theme = getEventCardTheme(event.type);
  const t = THEME_STYLES[theme];
  const decor = THEME_DECOR[theme];
  const info = getEventTypeInfo(event.type);
  const eventDate = new Date(event.date);
  const mapLink = findMapLink(event.details);
  const mapsUrl = mapLink || (event.latitude != null && event.longitude != null
    ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
    : event.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
      : null);
  const condolence = isCondolenceEvent(event.type);
  const light = theme === "ELEGANT" || theme === "CELEBRATORY";

  return (
    <div className="mx-auto max-w-2xl">
      <div
        className={cn("relative overflow-hidden rounded-3xl border-2 p-6 sm:p-8", t.shell)}
        style={t.pattern ? { backgroundImage: t.pattern } : undefined}
      >
        {/* corner florals (elegant) */}
        {theme === "ELEGANT" && (
          <>
            <span className="pointer-events-none absolute -left-2 -top-2 text-5xl opacity-60" aria-hidden>
              🌸
            </span>
            <span className="pointer-events-none absolute -bottom-3 -right-2 text-5xl opacity-60" aria-hidden>
              🌸
            </span>
            <span className="pointer-events-none absolute right-8 top-8 text-3xl opacity-50" aria-hidden>
              🌿
            </span>
          </>
        )}
        {theme === "CELEBRATORY" && (
          <>
            <span className="pointer-events-none absolute -left-1 top-10 text-4xl opacity-70" aria-hidden>
              🎈
            </span>
            <span className="pointer-events-none absolute -right-1 top-16 text-4xl opacity-70" aria-hidden>
              🎈
            </span>
            <span className="pointer-events-none absolute bottom-6 left-6 text-3xl opacity-60" aria-hidden>
              ⭐
            </span>
            <span className="pointer-events-none absolute bottom-10 right-10 text-3xl opacity-60" aria-hidden>
              🎉
            </span>
          </>
        )}
        {theme === "SOBER" && (
          <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[160px] leading-none opacity-[0.05]" aria-hidden>
            ✦
          </span>
        )}

        <div className="relative">
          {/* header */}
          <div className="mb-5 text-center">
            <div className={cn("text-sm font-medium tracking-wide", t.header)} dir="rtl">
              {decor.top}
            </div>
            <div className="mt-3 flex justify-center">
              <Badge className={cn("px-3 py-1 text-sm ring-1", t.chip)}>
                {info.emoji} {info.label} · {info.labelUrdu}
              </Badge>
            </div>
            {condolence && (
              <div className={cn("mt-3 flex items-center justify-center gap-2 text-sm", t.sub)}>
                <HeartHandshake className="h-4 w-4" />
                <span>With deep sympathy — خاندان کی طرف سے</span>
              </div>
            )}
          </div>

          {/* title */}
          <h1 className={cn("text-center leading-tight", t.title)}>{event.title}</h1>

          {/* cover */}
          {event.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimizeImageUrl(event.coverImage)}
              alt={event.title}
              className="mx-auto mt-5 max-h-56 rounded-2xl object-cover shadow-lg"
            />
          )}

          {/* host */}
          <div className={cn("mt-5 flex items-center justify-center gap-2 text-sm", t.sub)}>
            <User2 className="h-4 w-4" />
            <span>
              Hosted by <span className="font-semibold">{event.creator.name ?? "—"}</span>
            </span>
          </div>

          {/* vital details */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 ring-1", t.metaBg)}>
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs opacity-70">Date — تاریخ</div>
                <div className="truncate text-sm font-semibold">{formatDateTime(event.date)}</div>
                {event.hijriDate && <div className="text-xs opacity-70">Hijri: {event.hijriDate}</div>}
              </div>
            </div>
            {(eventDate.getHours() || eventDate.getMinutes()) && (
              <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 ring-1", t.metaBg)}>
                <Clock className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs opacity-70">Time — وقت</div>
                  <div className="text-sm font-semibold">
                    {eventDate.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )}
            {event.location && (
              <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 ring-1", t.metaBg)}>
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs opacity-70">Venue — مقام</div>
                  <div className="truncate text-sm font-semibold">{event.location}</div>
                </div>
              </div>
            )}
            {mapsUrl && (
              <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 ring-1", t.metaBg)}>
                <Navigation className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs opacity-70">Map — نقشہ</div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "text-sm font-semibold underline underline-offset-2",
                      light ? "hover:text-amber-700" : "hover:opacity-80"
                    )}
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* description */}
          {event.description && (
            <p
              className={cn(
                "mx-auto mt-5 max-w-prose whitespace-pre-wrap rounded-2xl px-4 py-3 text-center text-sm leading-relaxed",
                light ? "bg-white/60" : "bg-black/10",
                t.sub
              )}
            >
              {event.description}
            </p>
          )}

          {/* RSVP */}
          <div className="mt-7">
            <div className={cn("mb-3 text-center text-sm font-medium", t.header)}>
              {condolence ? "اپنا جواب دیں — Condolence / Going" : "کیا آپ آ رہے ہیں؟ — Will you attend?"}
            </div>
            <div className="flex justify-center">
              <RSVPButton
                eventId={event.id}
                eventType={event.type}
                initialStatus={event.myRsvp?.status ?? null}
                initialMessage={event.myRsvp?.message ?? null}
                counts={event.counts}
                onUpdate={() => onRsvpUpdate?.()}
              />
            </div>
            {event.myRsvp?.message && (
              <p dir="auto" className={cn("mx-auto mt-3 max-w-md rounded-xl px-4 py-2 text-center text-xs", t.metaBg)}>
                آپ کا پیغام: “{event.myRsvp.message}”
              </p>
            )}
          </div>

          {/* footer decor */}
          <div className={cn("mt-6 border-t pt-4 text-center text-xs opacity-80", light ? "border-amber-200" : "border-white/15", t.sub)} dir="rtl">
            {decor.bottom}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Sparkles className="h-3.5 w-3.5" />
        Digital Khandaan — Digital Invitation Card
      </div>
    </div>
  );
}
