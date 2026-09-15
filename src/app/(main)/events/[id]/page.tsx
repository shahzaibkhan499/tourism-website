"use client";

import { useEffect, useState } from "react";
import { eventLd, SITE_URL } from "@/lib/seo";
import { useInjectJsonLd } from "@/lib/seo-client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  MapPin,
  Clock,
  Share2,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  Lock,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { RSVPButton } from "@/components/events/rsvp-button";
import { InviteesPicker, type Invitee } from "@/app/(main)/events/create/form-parts";
import { formatDateTime, initials } from "@/lib/utils";
import { getEventTypeInfo } from "@/lib/constants";
import { Send } from "lucide-react";

const DETAIL_SECTION_LABELS: Record<string, string> = {
  part1: "Part I — General (بنیادی معلومات)",
  family: "Part II — Family References (خاندانی حوالہ جات)",
  death: "Part III — Death Details (وفات کی تفصیلات)",
  namaz: "Part IV — Namaz e Janaza (نمازِ جنازہ)",
  burial: "Part V — Burial / Tadfeen (تدفین)",
  condolence: "Part VI — Condolence Venue & Contact (تعزیتی محل)",
  social: "Part VII — Social (سوشل)",
  birth: "Part III — Birth Details (پیدائش کی تفصیلات)",
  medical: "Part IV — Medical / Hospital (طبی)",
  legal: "Part V — Personal / Legal (قانونی)",
  keepsakes: "Part VI — Keepsakes (یادگار چیزیں)",
};

function prettifyKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()).trim();
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  location: string | null;
  hijriDate: string | null;
  isPublic: boolean;
  isRecurring: boolean;
  recurringPattern: string | null;
  coverImage: string | null;
  creatorId: string;
  creator: { id: string; name: string | null; image: string | null };
  counts: { going: number; maybe: number; notGoing: number };
  attendees: Array<{ id: string; name: string | null; image: string | null }>;
  myRsvp: { status: string; guests: number; note: string | null; message?: string | null } | null;
  details?: Record<string, any> | null;
  rsvpsFull?: Array<{
    id: string;
    status: string;
    guests: number;
    note: string | null;
    message: string | null;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
  }>;
  isInvited?: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setEvent(data);
        const session = await fetch("/api/auth/session").then((r) => r.json());
        setMyUserId(session?.user?.id || null);
      })
      .catch(() => toast.error("ایونٹ لوڈ نہیں ہو سکا"))
      .finally(() => setLoading(false));
  }, [id]);

  useInjectJsonLd(
    "event-jsonld",
    event
      ? eventLd({
          name: event.title,
          description: event.description ?? null,
          startDate: event.date,
          endDate: event.endDate ?? null,
          location: event.location ?? null,
          image: event.coverImage ?? null,
          url: `${SITE_URL}/events/${event.id}`,
        })
      : null
  );

  useEffect(() => {
    if (event) document.title = `${event.title} — ایونٹ | Digital Family Tree`;
  }, [event]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ڈیلیٹ نہیں ہو سکا");
        return;
      }
      toast.success("ایونٹ ڈیلیٹ ہو گیا");
      router.push("/events");
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async (platform: "whatsapp" | "facebook" | "copy") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (platform === "copy") {
      await navigator.clipboard.writeText(url);
      toast.success("لنک کاپی ہو گیا!");
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${event?.title} — ${url}`)}`, "_blank");
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">ایونٹ نہیں ملا</h2>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-1 h-4 w-4" />
            ایونٹس پر واپس جائیں
          </Link>
        </Button>
      </div>
    );
  }

  const info = getEventTypeInfo(event.type);
  const isCreator = event.creatorId === myUserId;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/events">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Sab Events
        </Link>
      </Button>

      {/* Cover banner */}
      <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 sm:h-72">
        {event.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-8xl">{info.emoji}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge className="bg-white/90 text-emerald-800">
            {info.emoji} {info.label} · {info.labelUrdu}
          </Badge>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{event.title}</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold">Date</div>
                    <div className="text-sm text-gray-600">{formatDateTime(event.date)}</div>
                    {event.hijriDate && (
                      <div className="text-xs text-gray-400">Hijri: {event.hijriDate}</div>
                    )}
                  </div>
                </div>
                {event.endDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold">End Date</div>
                      <div className="text-sm text-gray-600">{formatDateTime(event.endDate)}</div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold">Location</div>
                      <div className="text-sm text-gray-600">{event.location}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  {event.isPublic ? (
                    <Globe className="mt-0.5 h-5 w-5 text-blue-600" />
                  ) : (
                    <Lock className="mt-0.5 h-5 w-5 text-amber-600" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">Visibility</div>
                    <div className="text-sm text-gray-600">{event.isPublic ? "Public" : "Private"}</div>
                  </div>
                </div>
              </div>

              {event.description && (
                <div className="border-t pt-4">
                  <div className="text-sm font-semibold">Description</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RSVP */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">آپ کا جواب؟</CardTitle>
            </CardHeader>
            <CardContent>
              <RSVPButton
                eventId={event.id}
                eventType={event.type}
                initialStatus={event.myRsvp?.status ?? null}
                initialMessage={event.myRsvp?.message ?? null}
                counts={event.counts}
                onUpdate={() => {
                  fetch(`/api/events/${id}`)
                    .then((r) => r.json())
                    .then((d) => {
                      if (!d.error) setEvent(d);
                    });
                }}
              />
              {event.myRsvp?.message && (
                <p dir="auto" className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                  آپ کا پیغام: “{event.myRsvp.message}”
                </p>
              )}
            </CardContent>
          </Card>

          {/* Round 10 — dynamic details (per-type JSON) */}
          {event.details && Object.keys(event.details).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تفصیلات — Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {Object.entries(event.details).map(([section, value]) =>
                  value && typeof value === "object" ? (
                    <div key={section}>
                      <h4 className="mb-2 text-sm font-semibold text-emerald-700">
                        {DETAIL_SECTION_LABELS[section] ?? section}
                      </h4>
                      <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        {Object.entries(value as Record<string, unknown>).map(([k, v]) =>
                          v === null || v === "" || v === undefined ? null : (
                            <div key={k} className="flex items-start justify-between gap-3 border-b border-gray-50 py-1">
                              <dt className="shrink-0 text-xs font-medium text-gray-400">{prettifyKey(k)}</dt>
                              <dd className="min-w-0 text-right text-sm text-gray-700">
                                {typeof v === "string" && /^https?:\/\//.test(v) && /map|link/i.test(k) ? (
                                  <a href={v} target="_blank" rel="noreferrer" className="text-emerald-600 underline underline-offset-2">
                                    Map Link
                                  </a>
                                ) : typeof v === "string" && /^https?:\/\//.test(v) && /(photo|picture|image|card|certificate|video|notification)/i.test(k) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <a href={v} target="_blank" rel="noreferrer" className="inline-block">
                                    <img src={v} alt={k} className="h-14 w-14 rounded-lg object-cover" />
                                  </a>
                                ) : typeof v === "boolean" ? (
                                  <span>{v ? "جی ہاں" : "نہیں"}</span>
                                ) : (
                                  <span dir="auto" className="break-words">
                                    {String(v)}
                                  </span>
                                )}
                              </dd>
                            </div>
                          )
                        )}
                      </dl>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>
          )}

          {/* Round 10 — creator dashboard: RSVP messages / duas */}
          {isCreator && (
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-base">
                  RSVP پیغامات و دعائیں ({(event.rsvpsFull ?? []).filter((r) => r.message).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(event.rsvpsFull ?? []).length === 0 ? (
                  <p className="py-3 text-center text-sm text-gray-400">
                    ابھی کوئی پیغام نہیں — جب ممبران جواب دیں گے تو ان کی دعائیں/پیغامات یہاں نظر آئیں گے۔
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {event.rsvpsFull!.map((r) => (
                      <li key={r.id} className="flex items-start gap-3 rounded-xl border p-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={r.user.image || undefined} />
                          <AvatarFallback>{initials(r.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{r.user.name}</span>
                            <Badge
                              variant="outline"
                              className={
                                r.status === "GOING"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : r.status === "MAYBE"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-red-200 bg-red-50 text-red-600"
                              }
                            >
                              {r.status === "GOING" ? (getEventTypeInfo(event.type).label === "Death" ? "Condole" : "Going") : r.status === "MAYBE" ? "Maybe" : "Not Going"}
                            </Badge>
                            <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
                          </div>
                          {r.message && (
                            <p dir="auto" className="mt-1.5 rounded-lg bg-blue-50/70 px-3 py-2 text-sm leading-relaxed text-gray-800">
                              {r.message}
                            </p>
                          )}
                          {r.note && <p className="mt-1 text-xs italic text-gray-500">{r.note}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Jaane Wale ({event.counts.going})</CardTitle>
            </CardHeader>
            <CardContent>
              {event.attendees.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">ابھی کسی نے تصدیق نہیں کی</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {event.attendees.map((a) => (
                    <Link key={a.id} href={`/profile/${a.id}`} className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={a.image || undefined} />
                        <AvatarFallback>{initials(a.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{a.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Banane Wale</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/profile/${event.creator.id}`} className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={event.creator.image || undefined} />
                  <AvatarFallback>{initials(event.creator.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{event.creator.name}</div>
                  <div className="text-xs text-gray-500">Event Creator</div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">شیئر کریں</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => handleShare("whatsapp")}>
                <Share2 className="mr-1 h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleShare("facebook")}>
                <Share2 className="mr-1 h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleShare("copy")}>
                <Share2 className="mr-1 h-4 w-4" />
                Copy Link
              </Button>
            </CardContent>
          </Card>

          {isCreator && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base">Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/events/create?edit=${event.id}`}>
                    <Pencil className="mr-1 h-4 w-4" />
                    ترمیم کریں
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={deleting}>
                      {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                      ڈیلیٹ کریں
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Kya aap yaqeeni delete karna chahte hain?</AlertDialogTitle>
                      <AlertDialogDescription>
                        یہ ایونٹ ہمیشہ کے لیے ڈیلیٹ ہو جائے گا اور یہ عمل واپس نہیں ہو سکتا۔
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                        ڈیلیٹ کریں
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {isCreator && (
            <Card className="border-emerald-100">
              <CardHeader>
                <CardTitle className="text-base">مدعو کریں — Invite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500">
                  مدعو ممبران کو Digital Card ملے گا۔ (Invitees receive a notification with the digital card.)
                </p>
                <InviteSection eventId={event.id} onInvited={() => {}} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- creator invite picker ---------------- */

function InviteSection({ eventId, onInvited }: { eventId: string; onInvited: () => void }) {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (invitees.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitees: invitees.map((i) => i.id) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "مدعو نہیں کیے جا سکے");
        return;
      }
      toast.success(`${data.invited} مدعوین کو Digital Card بھجوا گیا 🎉`);
      setInvitees([]);
      onInvited();
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <InviteesPicker value={invitees} onChange={setInvitees} />
      <Button
        onClick={send}
        disabled={sending || invitees.length === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        size="sm"
      >
        {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
        Digital Card بھجوائیں ({invitees.length})
      </Button>
    </div>
  );
}
