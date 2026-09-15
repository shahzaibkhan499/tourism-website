"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Ruler,
  GraduationCap,
  Briefcase,
  Landmark,
  MoonStar,
  Home,
  Users,
  HeartHandshake,
  Phone,
  ImagePlus,
  ShieldCheck,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { rishtaProfileSchema } from "@/lib/validators";
import {
  PAKISTANI_CITIES,
  MARITAL_STATUSES,
  RISHTA_HEIGHTS,
  BUILDS,
  INCOME_RANGES,
  MOTHER_TONGUES,
  RISHTA_QUALIFICATIONS,
  RISHTA_LANGUAGES,
  CASTES,
  SUB_CASTES,
  HOME_SIZES,
  CONTACT_RELATIONS,
  PARTNER_STATUSES,
  PARTNER_SECT_OPTIONS,
  SHARIA_PERDA_OPTIONS,
  HALAF_NAMA_TEXT,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type FormData = z.infer<typeof rishtaProfileSchema>;

const CHILDREN_OPTIONS = [
  { value: "0", label: "0 — کوئی نہیں" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4+" },
];

const opt = (s: string): Opt => ({ value: s });
const opts = (arr: readonly string[]) => arr.map(opt);

const defaultValues: FormData = {
  maritalStatus: "SINGLE",
  children: 0,
  height: "",
  weight: undefined,
  income: "",
  photos: [],
  isGuardianMode: false,
  formDetails: {
    personal: { gender: "MALE", name: "", dateOfBirth: "", motherTongue: "Urdu" },
    physical: { build: undefined, disability: false, disabilityDetails: "" },
    education: [],
    job: { company: "", nature: "", place: "", rank: "", futurePlans: "" },
    cultural: { languages: [], caste: "", subCast: "", hobbies: "" },
    religion: { sect: undefined },
    house: {
      home: undefined,
      size: "",
      location: "",
      land: false,
      vehicles: "",
      address: "",
      currentCity: "",
      nationality: "Pakistani",
      homeTown: "",
    },
    family: {
      fatherName: "",
      fatherOccupation: "",
      fatherMobile: "",
      motherName: "",
      motherOccupation: "",
      motherMobile: "",
      brothers: 0,
      brothersMarried: 0,
      sisters: 0,
      sistersMarried: 0,
    },
    partner: {
      statuses: [],
      minAge: undefined,
      maxAge: undefined,
      minHeight: "",
      city: "",
      caste: "",
      sect: "ANY",
      qualification: "",
      shariaPerda: "ANY",
      otherRequirements: "",
      divorcedAcceptable: false,
    },
    contact: { personName: "", relation: "SELF", mobile: "" },
    halafNama: false,
  },
};

/* ---------- small building blocks (click-first UI) ---------- */

function BLabel({ label, urdu }: { label: string; urdu?: string }) {
  return (
    <Label className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span>{label}</span>
      {urdu && <span dir="rtl" className="font-urdu text-xs text-gray-500">{urdu}</span>}
    </Label>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600">{msg}</p>;
}

function Section({
  n,
  icon: Icon,
  title,
  urdu,
  children,
}: {
  n: number;
  icon: typeof User;
  title: string;
  urdu: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
            {n}
          </span>
          <Icon className="h-4 w-4 shrink-0 text-pink-600" />
          <span>{title}</span>
          <span dir="rtl" className="font-urdu text-sm text-pink-700">{urdu}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function RadioPills({
  label,
  urdu,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  urdu?: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <BLabel label={label} urdu={urdu} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              value === o.value
                ? "border-pink-600 bg-pink-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Err msg={error} />
    </div>
  );
}

function BoolPills({
  label,
  urdu,
  value,
  onChange,
  yesLabel = "جی ہاں",
  noLabel = "نہیں",
}: {
  label: string;
  urdu?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <BLabel label={label} urdu={urdu} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={value}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            value ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
          )}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!value}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm transition-colors",
            !value ? "border-gray-500 bg-gray-500 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          )}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}

function CheckPills({
  label,
  urdu,
  options,
  values,
  onChange,
}: {
  label: string;
  urdu?: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    values.includes(v) ? onChange(values.filter((x) => x !== v)) : onChange([...values, v]);
  return (
    <div className="space-y-1.5">
      <BLabel label={label} urdu={urdu} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            aria-pressed={values.includes(o.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              values.includes(o.value)
                ? "border-pink-600 bg-pink-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
            )}
          >
            {values.includes(o.value) ? "✓ " : ""}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Select with optional free-text "Other — دیگر" escape hatch. */
interface Opt {
  value: string;
  label?: string;
}

function SelectOther({
  label,
  urdu,
  value,
  onChange,
  options,
  placeholder,
  withOther,
  allowAny,
  hideLabel,
  error,
}: {
  label: string;
  urdu?: string;
  value?: string | null;
  onChange: (v: string) => void;
  options: readonly Opt[];
  placeholder?: string;
  withOther?: boolean;
  allowAny?: boolean;
  hideLabel?: boolean;
  error?: string;
}) {
  const [otherMode, setOtherMode] = useState(false);
  const known = options.map((o) => o.value);
  const isOther = otherMode || (Boolean(value) && !known.includes(value as string));

  useEffect(() => {
    if (!value) setOtherMode(false);
  }, [value]);

  return (
    <div className="space-y-1.5">
      {!hideLabel && <BLabel label={label} urdu={urdu} />}
      <Select
        value={isOther ? "__other__" : allowAny && !value ? "__any__" : value || undefined}
        onValueChange={(v) => {
          if (v === "__other__") {
            setOtherMode(true);
            onChange("");
          } else if (v === "__any__") {
            setOtherMode(false);
            onChange("");
          } else {
            setOtherMode(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? "منتخب کریں"} />
        </SelectTrigger>
        <SelectContent>
          {allowAny && <SelectItem value="__any__">کوئی نہیں — Any</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label ?? o.value}
            </SelectItem>
          ))}
          {withOther && <SelectItem value="__other__">دیگر — Other</SelectItem>}
        </SelectContent>
      </Select>
      {isOther && (
        <Input
          autoFocus
          value={value ?? ""}
          placeholder="لکھیں — write it here"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <Err msg={error} />
    </div>
  );
}

/* ---------- the form ---------- */

export default function CreateRishtaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<0 | 1 | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(rishtaProfileSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "formDetails.education" });

  const fd = watch("formDetails");
  const halafNama = watch("formDetails.halafNama");
  const disability = watch("formDetails.physical.disability");
  const contactRelation = watch("formDetails.contact.relation");

  // Photo slots (0 = personal, 1 = family) kept in local state so removing one
  // never shifts the other; merged into the payload on submit.
  const [personalPhoto, setPersonalPhoto] = useState("");
  const [familyPhoto, setFamilyPhoto] = useState("");
  const photoFor = (slot: 0 | 1) => (slot === 0 ? personalPhoto : familyPhoto);
  const setPhotoFor = (slot: 0 | 1, v: string) => {
    if (slot === 0) setPersonalPhoto(v);
    else setFamilyPhoto(v);
  };

  const uploadPhoto = async (file: File, slot: 0 | 1) => {
    setUploadingSlot(slot);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "اپ لوڈ نہیں ہو سکا");
        return;
      }
      setPhotoFor(slot, data.url);
      toast.success("تصویر اپ لوڈ ہو گئی ✓");
    } catch {
      toast.error("اپ لوڈ میں مسئلہ آ گیا");
    } finally {
      setUploadingSlot(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = { ...data, photos: [personalPhoto, familyPhoto].filter(Boolean) };
      const res = await fetch("/api/rishta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "پروفائل محفوظ نہیں ہو سکی");
        return;
      }
      toast.success("رشتہ پروفائل بن گیا! حلف نامہ کے ساتھ — 💚");
      router.push(`/rishta/${result.id}`);
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  const [halafLtr, ...halafUrduLines] = HALAF_NAMA_TEXT.split("\n");
  const halafUrdu = halafUrduLines.join("\n");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Create Rishta Profile"
        titleUrdu="رشتہ پروفائل بنائیں"
        description="Click-first form — select & toggle, type less (فارم میں زیادہ تر کلک کریں، ٹائپنگ کم کریں)"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 1 — PERSONAL INFORMATION */}
        <Section n={1} icon={User} title="Personal Information" urdu="ذاتی معلومات">
          <RadioPills
            label="Gender"
            urdu="جنس"
            options={[
              { value: "MALE", label: "Male — لڑکا" },
              { value: "FEMALE", label: "Female — لڑکی" },
            ]}
            value={fd.personal.gender}
            onChange={(v) => setValue("formDetails.personal.gender", v as "MALE" | "FEMALE")}
            error={errors.formDetails?.personal?.gender?.message}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <BLabel label="Full Name" urdu="پورا نام" />
              <Input placeholder="e.g. Muhammad Ali" {...register("formDetails.personal.name")} />
              <Err msg={errors.formDetails?.personal?.name?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Date of Birth" urdu="تاریخ پیدائش" />
              <Input type="date" {...register("formDetails.personal.dateOfBirth")} />
              <Err msg={errors.formDetails?.personal?.dateOfBirth?.message} />
            </div>
            <SelectOther
              label="Marital Status"
              urdu="تأثیری حیثیت"
              value={watch("maritalStatus")}
              onChange={(v) => setValue("maritalStatus", v as FormData["maritalStatus"])}
              options={MARITAL_STATUSES.map((m) => ({ value: m.value, label: `${m.label} — ${m.labelUrdu}` }))}
              error={errors.maritalStatus?.message}
            />
            <div className="space-y-1.5">
              <BLabel label="Mother Tongue" urdu="مادری زبان" />
              <SelectOther
                label=""
                urdu=""
                hideLabel
                value={fd.personal.motherTongue}
                onChange={(v) => setValue("formDetails.personal.motherTongue", v)}
                options={opts(MOTHER_TONGUES)}
                withOther
                error={errors.formDetails?.personal?.motherTongue?.message}
              />
            </div>
            <SelectOther
              label="Children"
              urdu="بچے"
              value={String(watch("children"))}
              onChange={(v) => setValue("children", Number(v))}
              options={CHILDREN_OPTIONS}
              error={errors.children?.message}
            />
          </div>
        </Section>

        {/* 2 — PHYSICAL APPEARANCE */}
        <Section n={2} icon={Ruler} title="Physical Appearance" urdu="جسمانی ساخت">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectOther
              label="Height"
              urdu="قد"
              value={watch("height")}
              onChange={(v) => setValue("height", v)}
              options={opts(RISHTA_HEIGHTS)}
              error={errors.height?.message}
            />
            <div className="space-y-1.5">
              <BLabel label="Weight (kg)" urdu="وزن (کلو)" />
              <Input type="number" min={20} max={300} placeholder="e.g. 65" {...register("weight")} />
              <Err msg={errors.weight?.message} />
            </div>
            <SelectOther
              label="Complexion / Build"
              urdu="رنگت / جسمانی ساخت"
              value={fd.physical.build}
              onChange={(v) => setValue("formDetails.physical.build", v as "SLIM" | "MEDIUM" | "HEALTHY")}
              options={BUILDS.map((b) => ({ value: b.toUpperCase(), label: b }))}
              error={errors.formDetails?.physical?.build?.message}
            />
            <BoolPills
              label="Disability"
              urdu="معذوری"
              value={disability}
              onChange={(v) => setValue("formDetails.physical.disability", v)}
            />
          </div>
          {disability && (
            <div className="space-y-1.5">
              <BLabel label="Disability Details" urdu="معذوری کی تفصیل" />
              <Input placeholder="تفصیل لکھیں..." {...register("formDetails.physical.disabilityDetails")} />
              <Err msg={errors.formDetails?.physical?.disabilityDetails?.message} />
            </div>
          )}
        </Section>

        {/* 3 — EDUCATION DETAILS (multi-entry) */}
        <Section n={3} icon={GraduationCap} title="Education Details" urdu="تعلیمی تفصیلات">
          {fields.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 p-3 text-center text-sm text-gray-500">
              ابھی کوئی تعلیمی درجہ شامل نہیں — نیچے سے شامل کریں
            </p>
          )}
          {fields.map((f, i) => (
            <div key={f.id} className="space-y-3 rounded-xl border border-pink-100 bg-pink-50/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-pink-700">Entry {i + 1} — درجہ نمبر {i + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(i)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف کریں
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectOther
                  label="Qualification"
                  urdu="تعلیمی درجہ"
                  value={watch(`formDetails.education.${i}.qualification`) ?? ""}
                  onChange={(v) => setValue(`formDetails.education.${i}.qualification`, v)}
                  options={opts(RISHTA_QUALIFICATIONS)}
                  error={errors.formDetails?.education?.[i]?.qualification?.message}
                />
                <div className="space-y-1.5">
                  <BLabel label="Course / Diploma" urdu="کورس / ڈپلومہ" />
                  <Input placeholder="e.g. BSc CS" {...register(`formDetails.education.${i}.course`)} />
                  <Err msg={errors.formDetails?.education?.[i]?.course?.message} />
                </div>
                <div className="space-y-1.5">
                  <BLabel label="School" urdu="اسکول" />
                  <Input placeholder="e.g. Govt High School" {...register(`formDetails.education.${i}.school`)} />
                  <Err msg={errors.formDetails?.education?.[i]?.school?.message} />
                </div>
                <div className="space-y-1.5">
                  <BLabel label="College" urdu="کالج" />
                  <Input placeholder="e.g. PCSIR Labs College" {...register(`formDetails.education.${i}.college`)} />
                  <Err msg={errors.formDetails?.education?.[i]?.college?.message} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <BLabel label="University" urdu="یونیورسٹی" />
                  <Input placeholder="e.g. NUST, Karachi University" {...register(`formDetails.education.${i}.university`)} />
                  <Err msg={errors.formDetails?.education?.[i]?.university?.message} />
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ qualification: "", school: "", college: "", university: "", course: "" })}
            className="border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add More Education — مزید تعلیم شامل کریں
          </Button>
        </Section>

        {/* 4 — JOB / BUSINESS */}
        <Section n={4} icon={Briefcase} title="Job / Business" urdu="نوکری / کاروبار">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <BLabel label="Company / Business Name" urdu="کمپنی / بزنس کا نام" />
              <Input placeholder="e.g. Khan Traders" {...register("formDetails.job.company")} />
              <Err msg={errors.formDetails?.job?.company?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Nature of Job / Business" urdu="نوکری / بزنس کی نوعیت" />
              <Input placeholder="e.g. Cloth Trading" {...register("formDetails.job.nature")} />
              <Err msg={errors.formDetails?.job?.nature?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Place of Work" urdu="کام کی جگہ" />
              <Input placeholder="e.g. Karachi" {...register("formDetails.job.place")} />
              <Err msg={errors.formDetails?.job?.place?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Rank / Position" urdu="عہدہ / درجہ" />
              <Input placeholder="e.g. Senior Manager" {...register("formDetails.job.rank")} />
              <Err msg={errors.formDetails?.job?.rank?.message} />
            </div>
            <SelectOther
              label="Monthly Income"
              urdu="ماہانہ آمدنی"
              value={watch("income")}
              onChange={(v) => setValue("income", v)}
              options={opts(INCOME_RANGES)}
              error={errors.income?.message}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <BLabel label="Future Plans" urdu="مستقبل کے منصوبے" />
              <Textarea rows={3} placeholder="اپنے مستقبل کے منصوبے لکھیں..." {...register("formDetails.job.futurePlans")} />
              <Err msg={errors.formDetails?.job?.futurePlans?.message} />
            </div>
          </div>
        </Section>

        {/* 5 — CULTURAL & ETHICAL */}
        <Section n={5} icon={Landmark} title="Cultural & Ethical" urdu="ثقافتی و اخلاقی">
          <CheckPills
            label="Languages Spoken"
            urdu="زبانیں (جو بولتے ہیں)"
            options={RISHTA_LANGUAGES.map((l) => ({ value: l, label: l }))}
            values={fd.cultural.languages}
            onChange={(v) => setValue("formDetails.cultural.languages", v)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectOther
              label="Caste"
              urdu="ذات"
              value={fd.cultural.caste}
              onChange={(v) => setValue("formDetails.cultural.caste", v)}
              options={opts(CASTES)}
              withOther
              error={errors.formDetails?.cultural?.caste?.message}
            />
            <SelectOther
              label="Sub Cast / Ethnicity"
              urdu="ذیلی ذات / نسل"
              value={fd.cultural.subCast}
              onChange={(v) => setValue("formDetails.cultural.subCast", v)}
              options={opts(SUB_CASTES)}
              withOther
              error={errors.formDetails?.cultural?.subCast?.message}
            />
          </div>
          <div className="space-y-1.5">
            <BLabel label="Hobbies" urdu="مشاغل / دلچسپیاں" />
            <Textarea rows={2} placeholder="e.g. Cricket, reading, traveling..." {...register("formDetails.cultural.hobbies")} />
            <Err msg={errors.formDetails?.cultural?.hobbies?.message} />
          </div>
        </Section>

        {/* 6 — RELIGION DETAILS */}
        <Section n={6} icon={MoonStar} title="Religion Details" urdu="مذہبی تفصیلات">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <BLabel label="Religion" urdu="مذہب" />
              <Input value="Islam" readOnly disabled className="bg-gray-50 text-gray-600" />
            </div>
            <RadioPills
              label="Sect (Maslak)"
              urdu="مسلک"
              options={[
                { value: "SUNNI", label: "Sunni — سنی" },
                { value: "SHIA", label: "Shia — شیعہ" },
              ]}
              value={fd.religion.sect ?? undefined}
              onChange={(v) => setValue("formDetails.religion.sect", v as "SUNNI" | "SHIA")}
              error={errors.formDetails?.religion?.sect?.message}
            />
          </div>
        </Section>

        {/* 7 — HOUSE DETAILS */}
        <Section n={7} icon={Home} title="House Details" urdu="گھر کی تفصیلات">
          <div className="grid gap-4 sm:grid-cols-2">
            <RadioPills
              label="Home"
              urdu="گھر"
              options={[
                { value: "OWN", label: "Own — اپنا" },
                { value: "RENT", label: "Rent — کرایہ" },
              ]}
              value={fd.house.home ?? undefined}
              onChange={(v) => setValue("formDetails.house.home", v as "OWN" | "RENT")}
              error={errors.formDetails?.house?.home?.message}
            />
            <SelectOther
              label="Size"
              urdu="سائز"
              value={fd.house.size}
              onChange={(v) => setValue("formDetails.house.size", v)}
              options={opts(HOME_SIZES)}
              withOther
              error={errors.formDetails?.house?.size?.message}
            />
            <div className="space-y-1.5">
              <BLabel label="Location" urdu="مقام" />
              <Input placeholder="e.g. Clifton Block 5" {...register("formDetails.house.location")} />
              <Err msg={errors.formDetails?.house?.location?.message} />
            </div>
            <BoolPills label="Land Owned" urdu="زمین ملکیت میں" value={fd.house.land} onChange={(v) => setValue("formDetails.house.land", v)} />
            <div className="space-y-1.5">
              <BLabel label="Vehicles" urdu="گاڑیاں" />
              <Input placeholder="e.g. 1 car, 2 bikes" {...register("formDetails.house.vehicles")} />
              <Err msg={errors.formDetails?.house?.vehicles?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Address" urdu="پتہ" />
              <Input placeholder="مکمل پتہ — full address" {...register("formDetails.house.address")} />
              <Err msg={errors.formDetails?.house?.address?.message} />
            </div>
            <SelectOther
              label="Current City"
              urdu="موجودہ شہر"
              value={fd.house.currentCity}
              onChange={(v) => setValue("formDetails.house.currentCity", v)}
              options={opts(PAKISTANI_CITIES)}
              withOther
              error={errors.formDetails?.house?.currentCity?.message}
            />
            <div className="space-y-1.5">
              <BLabel label="Nationality" urdu="قومیت" />
              <Input placeholder="Pakistani" {...register("formDetails.house.nationality")} />
              <Err msg={errors.formDetails?.house?.nationality?.message} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <BLabel label="Home Town" urdu="آبائی شہر" />
              <Input placeholder="e.g. Miani, Bhera, Pind Dadan Khan" {...register("formDetails.house.homeTown")} />
              <Err msg={errors.formDetails?.house?.homeTown?.message} />
            </div>
          </div>
        </Section>

        {/* 8 — FAMILY DETAILS */}
        <Section n={8} icon={Users} title="Family Details" urdu="خاندان کی تفصیلات">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <BLabel label="Father Name" urdu="والد کا نام" />
              <Input {...register("formDetails.family.fatherName")} />
              <Err msg={errors.formDetails?.family?.fatherName?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Father's Occupation" urdu="والد کا پیشہ" />
              <Input {...register("formDetails.family.fatherOccupation")} />
              <Err msg={errors.formDetails?.family?.fatherOccupation?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Father Mobile No" urdu="والد کا موبائل" />
              <Input type="tel" placeholder="03001234567" {...register("formDetails.family.fatherMobile")} />
              <Err msg={errors.formDetails?.family?.fatherMobile?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Mother Name" urdu="والدہ کا نام" />
              <Input {...register("formDetails.family.motherName")} />
              <Err msg={errors.formDetails?.family?.motherName?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Mother's Occupation" urdu="والدہ کا پیشہ" />
              <Input {...register("formDetails.family.motherOccupation")} />
              <Err msg={errors.formDetails?.family?.motherOccupation?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Mother Mobile No" urdu="والدہ کا موبائل" />
              <Input type="tel" placeholder="03001234567" {...register("formDetails.family.motherMobile")} />
              <Err msg={errors.formDetails?.family?.motherMobile?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Brothers (count)" urdu="بھائی (تعداد)" />
              <Input type="number" min={0} max={30} {...register("formDetails.family.brothers")} />
              <Err msg={errors.formDetails?.family?.brothers?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Married Brothers" urdu="شادی شدہ بھائی" />
              <Input type="number" min={0} max={30} {...register("formDetails.family.brothersMarried")} />
              <Err msg={errors.formDetails?.family?.brothersMarried?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Sisters (count)" urdu="بہنیں (تعداد)" />
              <Input type="number" min={0} max={30} {...register("formDetails.family.sisters")} />
              <Err msg={errors.formDetails?.family?.sisters?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Married Sisters" urdu="شادی شدہ بہنیں" />
              <Input type="number" min={0} max={30} {...register("formDetails.family.sistersMarried")} />
              <Err msg={errors.formDetails?.family?.sistersMarried?.message} />
            </div>
          </div>
        </Section>

        {/* 9 — LIFE PARTNER REQUIREMENTS */}
        <Section n={9} icon={HeartHandshake} title="Life Partner Requirements" urdu="زندگی کے ساتھی کی ضروریات">
          <CheckPills
            label="Status Required"
            urdu="حیثیت (مطلوبہ)"
            options={PARTNER_STATUSES.map((s) => ({ value: s.value, label: `${s.label} — ${s.labelUrdu}` }))}
            values={fd.partner.statuses}
            onChange={(v) => setValue("formDetails.partner.statuses", v as FormData["formDetails"]["partner"]["statuses"])}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <BLabel label="Age — Min" urdu="کم از کم عمر" />
              <Input type="number" min={10} max={80} placeholder="e.g. 21" {...register("formDetails.partner.minAge")} />
              <Err msg={errors.formDetails?.partner?.minAge?.message} />
            </div>
            <div className="space-y-1.5">
              <BLabel label="Age — Max" urdu="زیادہ سے زیادہ عمر" />
              <Input type="number" min={10} max={80} placeholder="e.g. 30" {...register("formDetails.partner.maxAge")} />
              <Err msg={errors.formDetails?.partner?.maxAge?.message} />
            </div>
            <SelectOther
              label="Height Required (min)"
              urdu="قد (کم از کم)"
              value={fd.partner.minHeight}
              onChange={(v) => setValue("formDetails.partner.minHeight", v)}
              options={opts(RISHTA_HEIGHTS)}
              allowAny
              error={errors.formDetails?.partner?.minHeight?.message}
            />
            <SelectOther
              label="City Required"
              urdu="شہر (مطلوبہ)"
              value={fd.partner.city}
              onChange={(v) => setValue("formDetails.partner.city", v)}
              options={opts(PAKISTANI_CITIES)}
              withOther
              allowAny
              error={errors.formDetails?.partner?.city?.message}
            />
            <SelectOther
              label="Caste Required"
              urdu="ذات (مطلوبہ)"
              value={fd.partner.caste}
              onChange={(v) => setValue("formDetails.partner.caste", v)}
              options={opts(CASTES)}
              withOther
              allowAny
              error={errors.formDetails?.partner?.caste?.message}
            />
            <SelectOther
              label="Qualification Required"
              urdu="تعلیم (مطلوبہ)"
              value={fd.partner.qualification}
              onChange={(v) => setValue("formDetails.partner.qualification", v)}
              options={opts(RISHTA_QUALIFICATIONS)}
              allowAny
              error={errors.formDetails?.partner?.qualification?.message}
            />
            <RadioPills
              label="Sect Required"
              urdu="مسلک (مطلوبہ)"
              options={PARTNER_SECT_OPTIONS.map((s) => ({ value: s.value, label: `${s.label} — ${s.labelUrdu}` }))}
              value={fd.partner.sect}
              onChange={(v) => setValue("formDetails.partner.sect", v as "SUNNI" | "SHIA" | "ANY")}
              error={errors.formDetails?.partner?.sect?.message}
            />
            <RadioPills
              label="Sharia Perda"
              urdu="شریعتِ پردہ"
              options={SHARIA_PERDA_OPTIONS.map((s) => ({ value: s.value, label: `${s.label} — ${s.labelUrdu}` }))}
              value={fd.partner.shariaPerda}
              onChange={(v) => setValue("formDetails.partner.shariaPerda", v as "YES" | "NO" | "ANY")}
              error={errors.formDetails?.partner?.shariaPerda?.message}
            />
            <BoolPills
              label="If Divorced (Acceptable?)"
              urdu="اگر طلاق یافتہ (مناسب ہے؟)"
              value={fd.partner.divorcedAcceptable}
              onChange={(v) => setValue("formDetails.partner.divorcedAcceptable", v)}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <BLabel label="Any Other Requirements" urdu="کوئی دیگر ضروریات" />
              <Textarea rows={2} placeholder="دیگر کوئی شرط..." {...register("formDetails.partner.otherRequirements")} />
              <Err msg={errors.formDetails?.partner?.otherRequirements?.message} />
            </div>
          </div>
        </Section>

        {/* 10 — CONTACT PERSON */}
        <Section n={10} icon={Phone} title="Contact Person" urdu="رابطہ شخص">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <BLabel label="Person Name" urdu="شخص کا نام" />
              <Input {...register("formDetails.contact.personName")} />
              <Err msg={errors.formDetails?.contact?.personName?.message} />
            </div>
            <SelectOther
              label="Relation"
              urdu="رشتہ"
              value={contactRelation}
              onChange={(v) => setValue("formDetails.contact.relation", v as FormData["formDetails"]["contact"]["relation"])}
              options={CONTACT_RELATIONS.map((r) => ({ value: r.value, label: `${r.label} — ${r.labelUrdu}` }))}
              error={errors.formDetails?.contact?.relation?.message}
            />
            <div className="space-y-1.5">
              <BLabel label="Mobile No" urdu="موبائل نمبر" />
              <Input type="tel" placeholder="03001234567" {...register("formDetails.contact.mobile")} />
              <Err msg={errors.formDetails?.contact?.mobile?.message} />
            </div>
          </div>
          {contactRelation !== "SELF" && (
            <p className="rounded-lg bg-blue-50 p-2.5 text-xs text-blue-700">
              <span dir="rtl" className="font-urdu">
                نوٹ: رابطہ شخص خود کے علاوہ ہونے پر درخواستیں اس (سرپرست) کے پاس جائیں گی۔
              </span>
            </p>
          )}
        </Section>

        {/* 11 — PHOTOS */}
        <Section n={11} icon={ImagePlus} title="Photos" urdu="تصاویر">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { slot: 0 as const, title: "Boy / Girl Photo", urdu: "لڑکے / لڑکی کی تصویر" },
              { slot: 1 as const, title: "Complete Family Photo", urdu: "مکمل فیملی کی تصویر" },
            ].map(({ slot, title, urdu }) => (
              <div key={slot} className="space-y-1.5">
                <BLabel label={title} urdu={urdu} />
                <label
                  className={cn(
                    "flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                    photoFor(slot)
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50/40"
                  )}
                >
                  {photoFor(slot) ? (
                    <div className="relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoFor(slot)} alt={title} className="h-40 w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPhotoFor(slot, "");
                        }}
                        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 text-center">
                      {uploadingSlot === slot ? (
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-pink-500" />
                      ) : (
                        <ImagePlus className="mx-auto h-7 w-7 text-gray-400" />
                      )}
                      <p className="mt-1.5 text-xs text-gray-500">{uploadingSlot === slot ? "اپ لوڈ ہو رہی ہے..." : "تصویر اپ لوڈ کریں"}</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(file, slot);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            نوٹ: تصاویر صرف تصدیق شدہ صارفین کو دکھائی دیتی ہیں۔
          </p>
        </Section>

        {/* 12 — MANDATORY HALAF NAMA (OATH) */}
        <Card className="border-emerald-300 bg-emerald-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                12
              </span>
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Mandatory Halaf Nama (Oath) — ضروری حلف نامہ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-white p-4">
              <p dir="ltr" className="text-xs font-medium leading-relaxed text-emerald-900">
                {halafLtr}
              </p>
              <p dir="rtl" className="font-urdu whitespace-pre-line text-sm leading-loose text-emerald-900">
                {halafUrdu}
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600"
                {...register("formDetails.halafNama")}
              />
              <span className="text-sm font-medium text-emerald-900">
                <span dir="rtl" className="font-urdu">
                  میں اوپر لکھا ہوا حلف نامہ مانتا/مانتی ہوں اور گواہی دیتا/دیتی ہوں کہ دی گئی معلومات درست ہیں۔
                </span>
              </span>
            </label>
            <Err msg={errors.formDetails?.halafNama?.message} />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" asChild>
            <Link href="/rishta">منسوخ — Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-pink-600 hover:bg-pink-700"
            disabled={loading || uploadingSlot !== null || !halafNama}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {loading ? "محفوظ ہو رہا ہے..." : "پروفائل جمع کریں — Submit"}
          </Button>
        </div>
        {!halafNama && (
          <p dir="rtl" className="font-urdu text-right text-xs text-amber-700">
            حلف نامہ قبول کئے بغیر فارم جمع نہیں ہو سکتا۔
          </p>
        )}
      </form>
    </div>
  );
}
