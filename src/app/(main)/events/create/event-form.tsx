"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES } from "@/lib/constants";
import { eventSchema } from "@/lib/validators";

const formSchema = eventSchema;
type FormData = z.infer<typeof formSchema>;

const groups = Array.from(new Set(EVENT_TYPES.map((t) => t.group)));

/** "2026-09-11T18:30:00.000Z" → "2026-09-11" */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-09-11T18:30:00.000Z" → "18:30" (empty for midnight-only dates) */
function toTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (d.getHours() === 0 && d.getMinutes() === 0) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

interface EditableEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  location: string | null;
  hijriDate: string | null;
  coverImage: string | null;
  isPublic: boolean;
  isRecurring: boolean;
  recurringPattern: string | null;
}

export default function EventForm() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("edit");
  const router = useRouter();
  const isEditing = Boolean(eventId);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(isEditing);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "",
      date: "",
      endDate: "",
      time: "",
      location: "",
      hijriDate: "",
      description: "",
      coverImage: "",
      isPublic: false,
      isRecurring: false,
      recurringPattern: "WEEKLY",
    },
  });

  // Load existing event when in edit mode
  useEffect(() => {
    if (!eventId) {
      setLoadingEvent(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/events/${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: EditableEvent) => {
        if (cancelled) return;
        reset({
          title: data.title || "",
          type: data.type || "",
          date: toDateInput(data.date),
          endDate: data.endDate ? toDateInput(data.endDate) : "",
          time: toTimeInput(data.date),
          location: data.location || "",
          hijriDate: data.hijriDate || "",
          description: data.description || "",
          coverImage: data.coverImage || "",
          isPublic: Boolean(data.isPublic),
          isRecurring: Boolean(data.isRecurring),
          recurringPattern: data.recurringPattern || "WEEKLY",
        });
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("ایونٹ نہیں ملا");
          router.push("/events");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEvent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, reset, router]);

  const isRecurring = watch("isRecurring");
  const coverImage = watch("coverImage");

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "اپ لوڈ نہیں ہو سکا");
        return;
      }
      setValue("coverImage", data.url);
      toast.success("کور تصویر اپ لوڈ ہو گئی");
    } catch {
      toast.error("اپ لوڈ میں مسئلہ آ گیا");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/events/${eventId}` : "/api/events";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || (isEditing ? "ایونٹ اپ ڈیٹ نہیں ہو سکا" : "ایونٹ نہیں بن سکا"));
        return;
      }
      toast.success(isEditing ? "ایونٹ اپ ڈیٹ ہو گیا ✅" : "ایونٹ بن گیا! 🎉");
      router.push(`/events/${isEditing ? eventId : result.id}`);
      router.refresh();
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="ایونٹ میں ترمیم کریں" titleUrdu="تقریب میں تبدیلی" description="ایونٹ کی تفصیلات لوڈ ہو رہی ہیں..." />
        <Card>
          <CardContent className="space-y-5 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={isEditing ? "Edit Event" : "Create Event"}
        titleUrdu={isEditing ? "ایونٹ میں ترمیم کریں" : "نیا ایونٹ بنائیں"}
        description={
          isEditing
            ? "ایونٹ کی تفصیلات اپ ڈیٹ کر کے محفوظ کریں"
            : "فیملی کو مدعو کرنے کے لیے ایونٹ کی تفصیلات بھریں"
        }
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Event Title *</Label>
              <Input id="title" placeholder="مثلاً احمد کی شادی — نکاح" {...register("title")} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Event Type *</Label>
              <Select onValueChange={(v) => setValue("type", v)} value={watch("type") || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Event type chunein" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {groups.map((group) => {
                    const groupInfo = EVENT_TYPES.find((t) => t.group === group);
                    return (
                      <SelectGroup key={group}>
                        <SelectLabel>
                          {groupInfo?.groupUrdu} · {group}
                        </SelectLabel>
                        {EVENT_TYPES.filter((t) => t.group === group).map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.emoji} {t.label} — {t.labelUrdu}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" {...register("time")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hijriDate">Hijri Date</Label>
                <Input id="hijriDate" placeholder="e.g. 15 Ramadan 1446" {...register("hijriDate")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Marquee Hall, Gulberg, Lahore" {...register("location")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="ایونٹ کے بارے میں لکھیں — کیا ہوگا، کیا لائیں، وغیرہ۔"
                {...register("description")}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
                {coverImage ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt="Cover preview" className="max-h-40 rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setValue("coverImage", "")}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">
                      {uploading ? "اپ لوڈ ہو رہا ہے..." : "تصویر منتخب کرنے کے لیے کلک کریں (زیادہ سے زیادہ 5MB)"}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="text-sm font-medium">Public Event</div>
                <div className="text-xs text-gray-500">Public event sab users ko dikhega</div>
              </div>
              <Switch checked={watch("isPublic")} onCheckedChange={(v) => setValue("isPublic", v)} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="text-sm font-medium">Recurring Event</div>
                <div className="text-xs text-gray-500">یہ ایونٹ بار بار ہوگا</div>
              </div>
              <Switch checked={isRecurring} onCheckedChange={(v) => setValue("isRecurring", v)} />
            </div>

            {isRecurring && (
              <div className="space-y-1.5">
                <Label>Repeat Pattern</Label>
                <Select value={watch("recurringPattern") || "WEEKLY"} onValueChange={(v) => setValue("recurringPattern", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 border-t pt-5">
              <Button type="button" variant="outline" asChild>
                <Link href={isEditing ? `/events/${eventId}` : "/events"}>
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading || uploading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? isEditing
                    ? "اپ ڈیٹ ہو رہا ہے..."
                    : "ایونٹ بن رہا ہے..."
                  : isEditing
                    ? "تبدیلیاں محفوظ کریں"
                    : "ایونٹ بنائیں"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
