"use client";

/**
 * Round 10 — dynamic form for all event types except DEATH and BIRTH
 * (which have their own dedicated multi-part forms).
 * Type-specific culturally-appropriate fields are defined in TYPE_EXTRAS
 * and saved into Event.details JSON.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getEventTypeInfo } from "@/lib/constants";
import {
  BasicsPart,
  CancelBackLink,
  Field,
  InviteesPicker,
  Part,
  SelectField,
  UploadField,
  useEventSubmit,
  type Invitee,
  type Opt,
} from "./form-parts";
import { InviteAudienceSelect } from "@/components/events/invite-audience";
import type { InviteAudience } from "@/lib/event-invites";

interface ExtraField {
  name: string;
  label: string;
  labelUrdu: string;
  kind: "text" | "number" | "date" | "textarea" | "select";
  options?: Opt[];
  placeholder?: string;
}

const INDUSTRY: Opt[] = [
  { value: "Textile", label: "Textile" },
  { value: "Retail", label: "Retail" },
  { value: "Agriculture", label: "Agriculture" },
  { value: "IT", label: "IT / Software" },
  { value: "Banking", label: "Banking / Finance" },
  { value: "Transport", label: "Transport" },
  { value: "Food", label: "Food / Restaurant" },
  { value: "Health", label: "Health / Medical" },
  { value: "Other", label: "Other" },
];

const BRANCH: Opt[] = [
  { value: "Army", label: "Army — فوج" },
  { value: "Navy", label: "Navy — بحریہ" },
  { value: "AirForce", label: "Air Force — ایئر فورس" },
  { value: "Police", label: "Police — پولیس" },
  { value: "Other", label: "Other" },
];

const CASE_TYPE: Opt[] = [
  { value: "Property", label: "Property — جائیداد" },
  { value: "Family", label: "Family — خاندانی" },
  { value: "Criminal", label: "Criminal — جنائی" },
  { value: "Business", label: "Business — کاروباری" },
  { value: "Other", label: "Other" },
];

const TYPE_EXTRAS: Record<string, ExtraField[]> = {
  ENGAGEMENT: [
    { name: "groomName", label: "Groom Name", labelUrdu: "دولہا", kind: "text" },
    { name: "brideName", label: "Bride Name", labelUrdu: "دولہن", kind: "text" },
    { name: "venue", label: "Venue", labelUrdu: "مقام", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
  ],
  NIKKAH: [
    { name: "groomName", label: "Groom Name", labelUrdu: "دولہا", kind: "text" },
    { name: "brideName", label: "Bride Name", labelUrdu: "دولہن", kind: "text" },
    { name: "muftiName", label: "Mufti / Qazi", labelUrdu: "مفتی / قاضی", kind: "text" },
    { name: "walimaVenue", label: "Walima Venue", labelUrdu: "ولیمہ کا مقام", kind: "text" },
    { name: "walimaDate", label: "Walima Date", labelUrdu: "ولیمہ کی تاریخ", kind: "date" },
  ],
  AQEEQA: [
    { name: "childName", label: "Child Name", labelUrdu: "بچے کا نام", kind: "text" },
    { name: "slaughterDate", label: "Slaughter Date (7th day)", labelUrdu: "ذبح کی تاریخ (7واں دن)", kind: "date" },
    { name: "imamName", label: "Imam Name", labelUrdu: "امام کا نام", kind: "text" },
    { name: "distributionNote", label: "Distribution Note", labelUrdu: "تقسیم کی ہدایت", kind: "textarea" },
  ],
  BISMILLAH: [
    { name: "childName", label: "Child Name", labelUrdu: "بچے کا نام", kind: "text" },
    { name: "venue", label: "Venue", labelUrdu: "مقام", kind: "text" },
  ],
  BAPTISM: [
    { name: "childName", label: "Child Name", labelUrdu: "بچے کا نام", kind: "text" },
    { name: "churchName", label: "Church Name", labelUrdu: "چرچ کا نام", kind: "text" },
    { name: "pastorName", label: "Pastor / Priest", labelUrdu: "پیسٹر", kind: "text" },
  ],
  BURIAL: [
    { name: "deceasedName", label: "Deceased Name", labelUrdu: "مرحوم کا نام", kind: "text" },
    { name: "cemeteryName", label: "Cemetery Name", labelUrdu: "قبرستان کا نام", kind: "text", placeholder: "e.g. Bohri Graveyard" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
    { name: "contactName", label: "Contact Name", labelUrdu: "رابطہ کا نام", kind: "text" },
    { name: "contactMobile", label: "Contact Mobile", labelUrdu: "موبائل", kind: "text", placeholder: "03001234567" },
  ],
  CREMATION: [
    { name: "deceasedName", label: "Deceased Name", labelUrdu: "مرحوم کا نام", kind: "text" },
    { name: "venueName", label: "Venue Name", labelUrdu: "مقام کا نام", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
    { name: "contactName", label: "Contact Name", labelUrdu: "رابطہ کا نام", kind: "text" },
    { name: "contactMobile", label: "Contact Mobile", labelUrdu: "موبائل", kind: "text", placeholder: "03001234567" },
  ],
  ADOPTED: [
    { name: "childName", label: "Child Name", labelUrdu: "بچے کا نام", kind: "text" },
    { name: "adoptionDate", label: "Adoption Date", labelUrdu: "کفالت کی تاریخ", kind: "date" },
    { name: "agencyName", label: "Agency Name", labelUrdu: "ایجنسی کا نام", kind: "text" },
  ],
  DIVORCE: [
    { name: "spouseName", label: "Spouse Name", labelUrdu: "سرپرست کا نام", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
    { name: "note", label: "Note (private)", labelUrdu: "نوٹ", kind: "textarea" },
  ],
  ANNULMENT: [
    { name: "spouseName", label: "Spouse Name", labelUrdu: "سرپرست کا نام", kind: "text" },
    { name: "courtName", label: "Court Name", labelUrdu: "کوت کا نام", kind: "text" },
    { name: "note", label: "Note (private)", labelUrdu: "نوٹ", kind: "textarea" },
  ],
  QURAN_KHANI: [
    { name: "reciterName", label: "Reciter Name", labelUrdu: "قرآن خاں کا نام", kind: "text" },
    { name: "venue", label: "Venue (Masjid / Hall)", labelUrdu: "مقام", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
  ],
  HIFZ_E_QURAN: [
    { name: "studentName", label: "Student Name (Hafiz)", labelUrdu: "طالب علم کا نام", kind: "text" },
    { name: "teacherName", label: "Teacher Name (Murshid)", labelUrdu: "استاد کا نام", kind: "text" },
    { name: "durationYears", label: "Duration (years)", labelUrdu: "مدت (سال)", kind: "number" },
    { name: "venue", label: "Venue", labelUrdu: "مقام", kind: "text" },
  ],
  MILAD_UN_NABI: [
    { name: "venue", label: "Venue", labelUrdu: "مقام", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
    { name: "naatReader", label: "Naat Reader", labelUrdu: "ناط کا نام", kind: "text" },
  ],
  CHEHLUM: [
    { name: "deceasedName", label: "Deceased Name", labelUrdu: "مرحوم کا نام", kind: "text" },
    { name: "venue", label: "Venue", labelUrdu: "مقام", kind: "text" },
  ],
  BARSI: [
    { name: "deceasedName", label: "Deceased Name", labelUrdu: "مرحوم کا نام", kind: "text" },
    { name: "venue", label: "Venue", labelUrdu: "مقام", kind: "text" },
  ],
  OCCUPATION: [
    { name: "jobTitle", label: "Job Title", labelUrdu: "عہدہ", kind: "text" },
    { name: "companyName", label: "Company / Organization", labelUrdu: "کمپنی", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
  ],
  RETIREMENT: [
    { name: "previousJob", label: "Previous Job", labelUrdu: "پچھلا عہدہ", kind: "text" },
    { name: "serviceYears", label: "Years of Service", labelUrdu: "سروس کے سال", kind: "number" },
    { name: "newPlans", label: "New Plans", labelUrdu: "نئے منصوبے", kind: "textarea" },
  ],
  ELECTED: [
    { name: "position", label: "Position", labelUrdu: "عہدہ", kind: "text" },
    { name: "organization", label: "Organization", labelUrdu: "ادارہ", kind: "text" },
    { name: "termYears", label: "Term (years)", labelUrdu: "عہدہ کی مدت", kind: "number" },
  ],
  MILITARY_SERVICE: [
    { name: "rank", label: "Rank", labelUrdu: "درجہ", kind: "text", placeholder: "e.g. Major" },
    { name: "branch", label: "Branch", labelUrdu: "براہ", kind: "select", options: BRANCH },
    { name: "serviceYears", label: "Years of Service", labelUrdu: "سروس کے سال", kind: "number" },
  ],
  ORDINATION: [
    { name: "appointedBy", label: "Appointed By", labelUrdu: "تصدیق کرنے والے", kind: "text" },
    { name: "institution", label: "Institution", labelUrdu: "ادارہ", kind: "text" },
  ],
  EDUCATION: [
    { name: "schoolName", label: "School / Institute", labelUrdu: "اسکول / ادارہ", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
    { name: "boardName", label: "Board", labelUrdu: "بورڈ", kind: "text", placeholder: "e.g. BISE Karachi" },
  ],
  DEGREE: [
    { name: "degreeName", label: "Degree Name", labelUrdu: "ڈگری کا نام", kind: "text", placeholder: "e.g. BSc Computer Science" },
    { name: "university", label: "University / College", labelUrdu: "یونیورسٹی", kind: "text" },
    { name: "fieldOfStudy", label: "Field of Study", labelUrdu: "مضمون", kind: "text" },
  ],
  GRADUATION: [
    { name: "university", label: "University", labelUrdu: "یونیورسٹی", kind: "text" },
    { name: "degree", label: "Degree", labelUrdu: "ڈگری", kind: "text", placeholder: "e.g. BSc CS" },
    { name: "fieldOfStudy", label: "Field of Study", labelUrdu: "مضمون", kind: "text" },
    { name: "batchYear", label: "Batch / Year", labelUrdu: "سال", kind: "text", placeholder: "e.g. 2025" },
  ],
  DOCTORATE: [
    { name: "thesisTitle", label: "Thesis Title", labelUrdu: "تھیسس کا عنوان", kind: "textarea" },
    { name: "university", label: "University", labelUrdu: "یونیورسٹی", kind: "text" },
    { name: "fieldOfStudy", label: "Field of Study", labelUrdu: "مضمون", kind: "text" },
  ],
  TRAVEL: [
    { name: "destination", label: "Destination", labelUrdu: "مقصد", kind: "text", placeholder: "e.g. Makkah — Umrah" },
    { name: "purpose", label: "Purpose", labelUrdu: " مقصد", kind: "text" },
  ],
  LEGAL: [
    { name: "caseType", label: "Case Type", labelUrdu: "کیس کی قسم", kind: "select", options: CASE_TYPE },
    { name: "courtName", label: "Court Name", labelUrdu: "کوت کا نام", kind: "text" },
    { name: "caseNumber", label: "Case Number", labelUrdu: "کیس نمبر", kind: "text" },
  ],
  RESIDENCE: [
    { name: "newAddress", label: "New Address", labelUrdu: "نیا پتہ", kind: "textarea" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
  ],
  BUSINESS_OPENING: [
    { name: "businessName", label: "Business Name", labelUrdu: "بزنس کا نام", kind: "text" },
    { name: "industry", label: "Industry", labelUrdu: " شعبہ", kind: "select", options: INDUSTRY },
    { name: "address", label: "Address", labelUrdu: "پتہ", kind: "text" },
    { name: "city", label: "City", labelUrdu: "شہر", kind: "text" },
  ],
};

export default function GenericEventForm({ type }: { type: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const info = getEventTypeInfo(type);
  const extras = TYPE_EXTRAS[type] ?? [];

  const [invitees, setInvitees] = useState<Invitee[]>([]);
  // Round 12 (Fix 1) — bulk invite audience
  const [audience, setAudience] = useState<InviteAudience>("SPECIFIC");
  const [selectVals, setSelectVals] = useState<Record<string, string>>({});
  const { loading, submit } = useEventSubmit();

  const schema = z.object({
    title: z.string().min(2, "عنوان کم از کم 2 ہرف کا ہو — Title required"),
    date: z.string().min(1, "تاریخ منتخب کریں — Date required"),
    ...Object.fromEntries(extras.map((f) => [f.name, z.any().optional()])),
  });

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", date: "", location: "", time: "", description: "", hijriDate: "" },
  });
  const { register, handleSubmit, setValue, formState } = form;
  const errors = formState.errors as Record<string, { message?: string }>;

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    fetch(`/api/events/${editId}`)
      .then((r) => r.json())
      .then((ev) => {
        if (cancelled || ev.error) return;
        const d = ev.details ?? {};
        const set = (k: string, v: unknown) => setValue(k as never, v as never, { shouldValidate: false });
        set("title", ev.title ?? "");
        const dd = new Date(ev.date);
        set("date", !Number.isNaN(dd.getTime()) ? dd.toISOString().slice(0, 10) : "");
        const dt = new Date(ev.date);
        if (dt.getHours() || dt.getMinutes()) {
          set("time", `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`);
        }
        set("location", ev.location ?? "");
        set("hijriDate", ev.hijriDate ?? "");
        set("description", ev.description ?? "");
        for (const f of extras) {
          set(f.name, d[f.name] ?? "");
          if (f.kind === "select" && d[f.name]) setSelectVals((prev) => ({ ...prev, [f.name]: String(d[f.name]) }));
        }
      })
      .catch(() => {
        if (!cancelled) router.push("/events");
      });
    return () => {
      cancelled = true;
    };
  }, [editId, router, setValue]);

  const onSubmit = async (data: any) => {
    const details: Record<string, unknown> = {};
    for (const f of extras) {
      const v = data[f.name];
      details[f.name] = v === "" || v == null ? null : f.kind === "number" ? Number(v) || null : v;
    }
    await submit(editId, {
      title: data.title,
      type,
      date: data.date,
      time: data.time || null,
      location: data.location || null,
      hijriDate: data.hijriDate || null,
      description: data.description || null,
      details,
      invitees: invitees.map((i) => i.id),
      audience,
      isPublic: form.watch("isPublic") ?? false,
      isRecurring: form.watch("isRecurring") ?? false,
      recurringPattern: form.watch("recurringPattern") || null,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`${info.emoji} ${info.label} — ${info.labelUrdu}`}
        titleUrdu={`نیا ایونٹ: ${info.labelUrdu}`}
        description="تقریب کی تفصیلات درج کریں، خاندان کو مدعو کریں — ہر مدعو کو خوشخبری کا Digital Card ملے گا۔"
      />
      <div className="mb-4">
        <CancelBackLink href={editId ? `/events/${editId}` : "/events/create"} label="واپس — Back to grid" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Part n={1} title="Event Details" titleUrdu="تقریب کی تفصیلات">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Event Title" labelUrdu="عنوان" error={errors.title?.message} required>
                <Input placeholder={`مثلاً ${info.label} — ${info.labelUrdu}`} {...register("title")} />
              </Field>
            </div>
            {extras.map((f) =>
              f.kind === "select" ? (
                <SelectField
                  key={f.name}
                  label={f.label}
                  labelUrdu={f.labelUrdu}
                  options={f.options!}
                  value={selectVals[f.name]}
                  onValueChange={(v) => {
                    setSelectVals((prev) => ({ ...prev, [f.name]: v }));
                    form.setValue(f.name, v, { shouldValidate: true });
                  }}
                />
              ) : f.kind === "textarea" ? (
                <div key={f.name} className="sm:col-span-2">
                  <Field label={f.label} labelUrdu={f.labelUrdu}>
                    <Textarea rows={2} placeholder={f.placeholder} {...register(f.name)} />
                  </Field>
                </div>
              ) : (
                <Field key={f.name} label={f.label} labelUrdu={f.labelUrdu}>
                  <Input
                    type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"}
                    placeholder={f.placeholder}
                    {...register(f.name)}
                  />
                </Field>
              )
            )}
          </div>
        </Part>

        <BasicsPart form={form} partN={2} />

        <Part n={3} title="Cover Image" titleUrdu="کور تصویر">
          <UploadField label="Cover Image" labelUrdu="کور تصویر" value={form.watch("coverImage") || undefined} onChange={(v) => setValue("coverImage", v || null, { shouldValidate: true })} />
        </Part>

        <Part n={4} title="Invite Family (Digital Card)" titleUrdu="خاندان کو مدعو کریں" defaultOpen>
          <p className="mb-3 text-xs text-gray-500">
            مدعو ممبران کو اطلاع ملے گی اور وہ اسے کھول کر <span className="font-medium">Digital Card</span> دیکھ کر اپنا جواب بھیج سکیں گے۔
          </p>
          <InviteAudienceSelect value={audience} onValueChange={setAudience} className="mb-3" />
          {audience === "SPECIFIC" ? (
            <InviteesPicker value={invitees} onChange={setInvitees} />
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <span dir="auto">
                <span dir="ltr">One-click invite:</span>{" "}
                <span dir="rtl" className="font-urdu">
                  {audience === "FAMILY"
                    ? "آپ کے فمیلی ٹری کے تمام ممبران کو"
                    : audience === "CLAN"
                      ? "آپ کے قبیلے کے تمام ممبران کو"
                      : "آپ کی کمیونٹی کے تمام ممبران کو"}{" "}
                  یہ ڈیجیٹل کارڈ بھیج دیا جائے گا۔
                </span>
              </span>
            </div>
          )}
        </Part>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "محفوظ ہو رہا ہے..." : "محفوظ کریں — Save & Invite"}
          </Button>
        </div>
      </form>
    </div>
  );
}
