"use client";

import {
  Phone,
  Briefcase,
  Star,
  Sparkles,
  Baby,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SectionValue = Record<string, unknown> | null;

interface PublicSectionsProps {
  sections: Record<string, SectionValue>;
  occupation: {
    employmentStatus: string | null;
    jobType: string | null;
    details: Record<string, Record<string, unknown>> | null;
  } | null;
  isOwn: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  EMPLOYED: "ملازم",
  UNEMPLOYED: "بے روزگار",
  STUDENT: "طالب علم",
  RETIRED: "ریٹائرڈ",
  HOMEMAKER: "گھریلو",
};

function flatten(obj: Record<string, unknown>, prefix = ""): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flatten(v as Record<string, unknown>, prefix ? `${prefix} · ${k}` : k));
    } else if (v !== null && v !== undefined && v !== "" && v !== false) {
      out.push([prefix ? `${prefix} · ${k}` : k, String(v)]);
    }
  }
  return out;
}

function SectionBlock({
  icon: Icon,
  title,
  titleUrdu,
  data,
}: {
  icon: typeof Phone;
  title: string;
  titleUrdu: string;
  data: SectionValue;
}) {
  const rows = flatten((data ?? {}) as Record<string, unknown>);
  if (rows.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
          <Icon className="h-4 w-4 text-emerald-600" />
          <span>{title}</span>
          <span dir="rtl" className="font-urdu text-sm text-emerald-700">{titleUrdu}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="text-xs font-semibold uppercase text-gray-400">{k}</div>
            <p className="mt-0.5 break-words text-sm text-gray-700">{v}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PublicSections({ sections, occupation, isOwn }: PublicSectionsProps) {
  const hasAnything =
    Object.values(sections).some((s) => s && Object.keys(s).length > 0) || occupation !== null;

  if (!hasAnything) return null;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold">
        مزید تفصیلات
        {isOwn && <span className="ml-2 text-xs font-normal text-gray-400">(پرائیویسی کے مطابق)</span>}
      </h2>

      {occupation && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              <span>Occupation</span>
              <span dir="rtl" className="font-urdu text-sm text-emerald-700">روزگار</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              {STATUS_LABELS[occupation.employmentStatus ?? ""] ?? occupation.employmentStatus ?? "—"}
              {occupation.details
                ? ` · ${Object.values(occupation.details).flatMap((d) => Object.values(d).filter(Boolean)).length} تفصیلات بھری ہوئی`
                : ""}
            </p>
          </CardContent>
        </Card>
      )}

      <SectionBlock icon={Baby} title="Birth" titleUrdu="پیدائش" data={sections.birth ?? null} />
      <SectionBlock icon={Phone} title="Contact" titleUrdu="رابطہ" data={sections.contact ?? null} />
      <SectionBlock icon={Briefcase} title="Experience" titleUrdu="تجربہ" data={sections.experience ?? null} />
      <SectionBlock icon={Star} title="Favorites" titleUrdu="پسندیدہ" data={sections.favorites ?? null} />
      <SectionBlock icon={Sparkles} title="Personal Info" titleUrdu="ذاتی معلومات" data={sections.personal ?? null} />

      {!isOwn && (
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldAlert className="h-3.5 w-3.5" />
          کچھ سیکشنز اس صارف کی پرائیویسی ترتیبات کی وجہ سے چھپے ہوئے ہیں۔
        </p>
      )}
    </div>
  );
}
