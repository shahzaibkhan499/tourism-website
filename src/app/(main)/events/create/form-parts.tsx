"use client";

/**
 * Round 10 — shared building blocks for the dynamic event forms
 * (category grid → per-type accordion forms).
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ChevronDown, Loader2, Search, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Accordion "Part" section                                            */
/* ------------------------------------------------------------------ */

export function Part({
  n,
  title,
  titleUrdu,
  children,
  defaultOpen = true,
}: {
  n: number;
  title: string;
  titleUrdu: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            Part {n} — {title}
          </span>
          <span className="block text-xs text-gray-500" dir="rtl" style={{ textAlign: "left" }}>
            {titleUrdu}
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t p-4">{children}</div>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Field wrapper                                                       */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  labelUrdu,
  error,
  required,
  children,
}: {
  label: string;
  labelUrdu?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
        {labelUrdu && (
          <span className="mr-2 text-xs font-normal text-gray-400" dir="rtl">
            {labelUrdu}
          </span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Select (controlled by parent via RHF watch/setValue)                */
/* ------------------------------------------------------------------ */

export interface Opt {
  value: string;
  label: string;
  labelUrdu?: string;
}

export function useSelectFormValue<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  name: string
) {
  const v = form.watch(name as never) as unknown;
  return {
    value: (v as string | undefined) || undefined,
    onValueChange: (nv: string) => form.setValue(name as never, nv as never, { shouldValidate: true }),
  };
}

export function SelectField({
  label,
  labelUrdu,
  options,
  placeholder = "Select...",
  value,
  onValueChange,
  error,
  required,
}: {
  label: string;
  labelUrdu?: string;
  options: readonly Opt[];
  placeholder?: string;
  value?: string;
  onValueChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} labelUrdu={labelUrdu} error={error} required={required}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
              {o.labelUrdu ? ` — ${o.labelUrdu}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Upload field (Cloudinary via /api/media/upload)                     */
/* ------------------------------------------------------------------ */

export function UploadField({
  label,
  labelUrdu,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: {
  label: string;
  labelUrdu?: string;
  value: string | undefined;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "اپ لوڈ نہیں ہو سکا");
        return;
      }
      onChange(data.url);
      toast.success(`${label} اپ لوڈ ہو گیا`);
    } catch {
      toast.error("اپ لوڈ میں مسئلہ آ گیا");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label} labelUrdu={labelUrdu}>
      {value ? (
        <div className="flex items-center gap-3">
          {accept.startsWith("image") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <span className="text-sm text-emerald-700">فائل موجود ہے ✓</span>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-3 text-sm text-gray-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4" />
              فائل منتخب کریں
            </>
          )}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Invitees picker — search users, add as chips                        */
/* ------------------------------------------------------------------ */

export interface Invitee {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

export function InviteesPicker({
  value,
  onChange,
}: {
  value: Invitee[];
  onChange: (v: Invitee[]) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Invitee[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data.items ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const add = (u: Invitee) => {
    if (!value.some((x) => x.id === u.id)) onChange([...value, u]);
    setQ("");
    setResults([]);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام یا ای میل تلاش کریں — Search family members..."
          className="pl-9"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>

      {q.trim().length >= 2 && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border bg-white shadow-sm">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => add(u)}
              className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-emerald-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                {(u.name ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{u.name}</span>
                <span className="block truncate text-xs text-gray-400">{u.email}</span>
              </span>
              <span className="text-xs font-medium text-emerald-600">مدعو کریں +</span>
            </button>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((u) => (
            <span
              key={u.id}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 py-1 pl-3 pr-1.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200"
            >
              {u.name ?? u.email}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== u.id))}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 hover:bg-emerald-300"
                aria-label={`Remove ${u.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Submit helper                                                       */
/* ------------------------------------------------------------------ */

export function useEventSubmit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const submit = async (eventId: string | null, payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const url = eventId ? `/api/events/${eventId}` : "/api/events";
      const res = await fetch(url, {
        method: eventId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        const details = result?.details
          ? Object.values(result.details)
              .flat()
              .filter(Boolean)
              .join(" · ")
          : "";
        toast.error(result?.error || (details ? details : "ایونٹ محفوظ نہیں ہو سکا"));
        return false;
      }
      toast.success(eventId ? "ایونٹ اپ ڈیٹ ہو گیا ✅" : "ایونٹ بن گیا! 🎉 مدعوین کو اطلاع بھیج دی گئی");
      const id = eventId ?? result?.id;
      if (id) {
        router.push(`/events/${id}`);
        router.refresh();
      }
      return true;
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, submit };
}

/* ------------------------------------------------------------------ */
/* Shared "Event Basics" part (date/time/location/visibility)          */
/* ------------------------------------------------------------------ */

export function BasicsPart({
  form,
  partN,
  skipDate,
  skipLocation,
}: {
  form: UseFormReturn<any>;
  partN: number;
  skipDate?: boolean;
  skipLocation?: boolean;
}) {
  const { register } = form;
  const err = (k: string) => ((form.formState.errors as Record<string, { message?: string }>) ?? {})[k]?.message;
  const pubSel = useSelectFormValue(form, "isPublic");
  const recSel = useSelectFormValue(form, "isRecurring");
  const isPublic = form.watch("isPublic");
  const isRecurring = form.watch("isRecurring");
  const patSel = useSelectFormValue(form, "recurringPattern");

  return (
    <Part n={partN} title="Event Basics" titleUrdu="ایونٹ کی بنیادی معلومات" defaultOpen>
      <div className="grid gap-4 sm:grid-cols-2">
        {!skipDate && (
          <Field label="Date" labelUrdu="تاریخ" error={err("date")} required>
            <Input type="date" {...register("date")} />
          </Field>
        )}
        <Field label="Time" labelUrdu="وقت">
          <Input type="time" {...register("time")} />
        </Field>
        {!skipLocation && (
          <Field label="Location" labelUrdu="مقام">
            <Input placeholder="e.g. Marquee Hall, Gulberg, Lahore" {...register("location")} />
          </Field>
        )}
        <Field label="Hijri Date" labelUrdu="هجری تاریخ">
          <Input placeholder="e.g. 15 Ramadan 1446" {...register("hijriDate")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" labelUrdu="تفصیل">
            <Textarea rows={3} placeholder="تقریب کے بارے میں لکھیں — کیا ہوگا، کیا لائیں، وغیرہ" {...register("description")} />
          </Field>
        </div>
        <SelectField
          label="Visibility"
          labelUrdu="دیکھنے والے"
          options={[
            { value: "PRIVATE", label: "Private — خفیہ" },
            { value: "PUBLIC", label: "Public — عام" },
          ]}
          value={pubSel.value ?? "PRIVATE"}
          onValueChange={(v) => form.setValue("isPublic", v === "PUBLIC", { shouldValidate: true })}
        />
        <SelectField
          label="Recurring?"
          labelUrdu="بار بار ہوگا؟"
          options={[
            { value: "NO", label: "No — نہیں" },
            { value: "YES", label: "Yes — جی ہاں" },
          ]}
          value={recSel.value ?? "NO"}
          onValueChange={(v) => form.setValue("isRecurring", v === "YES", { shouldValidate: true })}
        />
        {isRecurring && (
          <SelectField
            label="Repeat Pattern"
            labelUrdu="دہرانی"
            options={[
              { value: "WEEKLY", label: "Weekly" },
              { value: "MONTHLY", label: "Monthly" },
              { value: "YEARLY", label: "Yearly" },
            ]}
            value={patSel.value ?? "WEEKLY"}
            onValueChange={patSel.onValueChange}
          />
        )}
        <div className={cn("flex items-center justify-center rounded-lg border bg-gray-50 text-sm", isPublic ? "text-blue-600" : "text-amber-600")}>
          {isPublic ? "🌐 Public event — sab dekh sakte hain" : "🔒 Private — sirf aap ke mad'u"}
        </div>
      </div>
    </Part>
  );
}

export function CancelBackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
    >
      <X className="h-4 w-4" />
      {label}
    </Link>
  );
}
