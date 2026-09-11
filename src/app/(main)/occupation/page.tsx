"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Building2, Landmark, Stethoscope, Scale, ChevronRight, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OccupationData = {
  employmentStatus?: string;
  jobType?: string;
  details?: Record<string, Record<string, string | number | boolean | null | undefined>>;
};

const EMPLOYMENT_STATUS = [
  { value: "EMPLOYED", label: "ملازم (Employed)" },
  { value: "UNEMPLOYED", label: "بے روزگار (Unemployed)" },
  { value: "STUDENT", label: "طالب علم (Student)" },
  { value: "RETIRED", label: "ریٹائرڈ (Retired)" },
  { value: "HOMEMAKER", label: "گھریلو (Homemaker)" },
];

const JOB_TYPES = [
  { value: "FULL_TIME", label: "فل ٹائم (Full-time)" },
  { value: "PART_TIME", label: "پارٹ ٹائم (Part-time)" },
  { value: "CONTRACT", label: "کانٹریکٹ (Contract)" },
  { value: "FREELANCE", label: "فری لانس (Freelance)" },
  { value: "BUSINESS_OWNER", label: "بزنس اونر (Business Owner)" },
];

const INDUSTRIES = [
  "Accommodation & Food Services (ہوٹل، ریستوران)",
  "Agriculture & Forestry (زراعت، باغبانی)",
  "Culture & Entertainment (فلم، تھیٹر، موسیقی)",
  "Tourism, Sports & Recreation (سیاحت، کھیل)",
  "Construction (تعمیرات، آرکیٹیکٹ)",
  "Educational Services (تدریس، ٹریننگ)",
  "Finance & Insurance (بینک، انشورنس، اکاؤنٹنگ)",
  "Health Care & Social Service (ہسپتال، ڈاکٹر، نرسنگ)",
  "Manufacturing & Production (مینوفیکچرنگ)",
  "Media & Information (اخبارات، ٹی وی، انٹرنیٹ، اشتہارات)",
  "Mining & Energy (کوئلہ، گیس، تیل، توانائی)",
  "Other Services (لانڈری، حجام، گھریلو خدمات)",
  "Professional, Scientific & Technical (تحقیق، مشاورت، قانونی)",
  "Public Administration (حکومتی ادارے، فوج، پولیس)",
  "Real Estate, Rental & Leasing (جائیداد)",
  "Sales (تھوک، پرچون، درآمد و برآمد)",
  "Transportation & Warehousing (ٹرانسپورٹ، ڈاک)",
];

const SECTIONS = [
  {
    key: "corporate",
    title: "Corporate & Private Sector",
    titleUrdu: "کارپوریٹ اور پرائیویٹ سیکٹر",
    description: "نوکری کی تفصیلات — عہدہ، کمپنی، شعبہ",
    icon: Briefcase,
    fields: [
      { name: "jobTitle", label: "Job Title / Designation", urdu: "نوکری کا عہدہ" },
      { name: "company", label: "Company / Organization Name", urdu: "کمپنی / ادارے کا نام" },
      { name: "industry", label: "Industry / Sector", urdu: "انڈسٹری / شعبہ", select: INDUSTRIES },
      { name: "department", label: "Department (e.g., HR, Finance)", urdu: "محکمہ (مثلاً HR، فنانس)" },
      { name: "totalExperience", label: "Total Experience (Years)", urdu: "کل تجربہ (سال)", number: true },
    ],
  },
  {
    key: "business",
    title: "Business & Entrepreneurship",
    titleUrdu: "بزنس اور کاروبار",
    description: "اپنے کاروبار کی تفصیلات",
    icon: Building2,
    fields: [
      { name: "businessName", label: "Business / Company Name", urdu: "بزنس / کمپنی کا نام" },
      { name: "businessType", label: "Business Type (e.g., Retail)", urdu: "بزنس کی قسم (مثلاً ریٹیل)" },
      { name: "role", label: "Your Role (e.g., Founder, CEO)", urdu: "آپ کا کردار (مثلاً بانی، CEO)" },
      { name: "businessCity", label: "Business Location / City", urdu: "بزنس کا مقام / شہر" },
    ],
  },
  {
    key: "government",
    title: "Government & Public Sector",
    titleUrdu: "سرکاری اور عوامی شعبہ",
    description: "سرکاری ملازمت کی تفصیلات",
    icon: Landmark,
    fields: [
      { name: "department", label: "Department / Ministry", urdu: "محکمہ / وزارت" },
      { name: "bpsGrade", label: "BPS (Basic Pay Scale) / Grade", urdu: "BPS / گریڈ" },
      { name: "postingCity", label: "Current Posting City", urdu: "موجودہ پوسٹنگ کا شہر" },
    ],
  },
  {
    key: "medical",
    title: "Medical & Healthcare Professionals",
    titleUrdu: "میڈیکل اور صحت کے شعبے",
    description: "طبی پیشہ ور افراد کے لیے",
    icon: Stethoscope,
    fields: [
      { name: "specialty", label: "Specialty (e.g., Cardiologist)", urdu: "اسپیشلٹی (مثلاً ماہر امراض قلب)" },
      { name: "hospitalClinic", label: "Hospital / Clinic Name", urdu: "ہسپتال / کلینک کا نام" },
      { name: "pmdcNumber", label: "PMDC / PMC Registration Number", urdu: "PMDC / PMC رجسٹریشن نمبر" },
    ],
  },
  {
    key: "specialized",
    title: "Specialized Professions",
    titleUrdu: "خصوصی پیشے",
    description: "قانون، انجینئرنگ، تعلیم کے شعبے",
    icon: Scale,
    fields: [
      { name: "field", label: "Field (e.g., Lawyer, Professor)", urdu: "شعبہ (مثلاً وکیل، پروفیسر)" },
      { name: "affiliation", label: "Institutional Affiliation / Bar Council", urdu: "ادارہ / بار کونسل" },
    ],
  },
];

const STATUS_KEYS: Record<string, string> = {
  EMPLOYED: "ملازم",
  UNEMPLOYED: "بے روزگار",
  STUDENT: "طالب علم",
  RETIRED: "ریٹائرڈ",
  HOMEMAKER: "گھریلو",
};

export default function OccupationPage() {
  const [data, setData] = useState<OccupationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState({ employmentStatus: "EMPLOYED", jobType: "FULL_TIME" });

  const load = () => {
    fetch("/api/occupation")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const payload = j ?? {};
        setData(payload);
        setStatusForm({
          employmentStatus: payload.employmentStatus ?? "EMPLOYED",
          jobType: payload.jobType ?? "FULL_TIME",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const saveStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/occupation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusForm),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "کچھ غلط ہو گیا");
      toast.success("روزگار کی حیثیت محفوظ ہو گئی!");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <PageHeader
        title="Occupation"
        titleUrdu="روزگار"
        description="اپنے روزگار کی مکمل تفصیلات محفوظ کریں — عنوان پر کلک کریں اور متعلقہ فارم کھل جائے گا"
      />

      {/* Employment Status */}
      <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span>1. Employment Status</span>
            <span dir="rtl" className="font-urdu text-lg text-emerald-700">روزگار کی حیثیت</span>
          </CardTitle>
          <CardDescription>موجودہ حیثیت اور نوکری کی قسم منتخب کریں</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Current Status — موجودہ حیثیت</Label>
            <Select
              value={statusForm.employmentStatus}
              onValueChange={(v) => setStatusForm((s) => ({ ...s, employmentStatus: v }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_STATUS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Type — نوکری کی قسم</Label>
            <Select value={statusForm.jobType} onValueChange={(v) => setStatusForm((s) => ({ ...s, jobType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={saveStatus} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" /> محفوظ کریں
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section, idx) => {
          const filled = data?.details?.[section.key];
          const count = filled ? Object.values(filled).filter(Boolean).length : 0;
          return (
            <Card
              key={section.key}
              className="cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md"
              onClick={() => setOpenSection(section.key)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span>{idx + 2}. {section.title}</span>
                  </CardTitle>
                  <p dir="rtl" className="font-urdu text-emerald-700">{section.titleUrdu}</p>
                  <CardDescription className="mt-1">{section.description}</CardDescription>
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    count > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
                  )}
                >
                  <section.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {count > 0 ? `${count} فیلڈز بھری ہوئی ہیں` : "ابھی نہیں بھرا گیا"}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                  {count > 0 ? "ترمیم کریں" : "بھریں"} <ChevronRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section form dialog */}
      <SectionDialog
        section={SECTIONS.find((s) => s.key === openSection) ?? null}
        initial={data?.details?.[openSection ?? ""]}
        onClose={() => setOpenSection(null)}
        onSaved={() => {
          setOpenSection(null);
          load();
        }}
      />
    </div>
  );
}

function SectionDialog({
  section,
  initial,
  onClose,
  onSaved,
}: {
  section: (typeof SECTIONS)[number] | null;
  initial?: Record<string, string | number | boolean | null | undefined>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) {
      const v: Record<string, string> = {};
      for (const f of section.fields) {
        v[f.name] = initial?.[f.name] != null ? String(initial[f.name]) : "";
      }
      setValues(v);
    }
  }, [section, initial]);

  if (!section) return null;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/occupation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: section.key, data: values }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "کچھ غلط ہو گیا");
      toast.success(`${section.titleUrdu} محفوظ ہو گیا!`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span>{section.title}</span>
            <span dir="rtl" className="font-urdu text-lg text-emerald-700">{section.titleUrdu}</span>
          </DialogTitle>
          <DialogDescription>{section.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {section.fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={`occ-${f.name}`} className="flex flex-wrap items-baseline gap-x-3">
                <span>{f.label}</span>
                <span dir="rtl" className="font-urdu text-xs text-gray-500">{f.urdu}</span>
              </Label>
              {f.select ? (
                <Select value={values[f.name] ?? "all"} onValueChange={(v) => setValues((s) => ({ ...s, [f.name]: v === "all" ? "" : v }))}>
                  <SelectTrigger id={`occ-${f.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">تمام</SelectItem>
                    {f.select.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`occ-${f.name}`}
                  type={f.number ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>منسوخ</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> محفوظ کریں
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
