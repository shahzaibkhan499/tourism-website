"use client";

import { Briefcase } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const EMPLOYMENT_TYPES = [
  "Full-Time", "Part-Time", "Self-Employed", "Freelance",
  "Contract", "Internship", "Apprenticeship", "Seasonal",
];
const LOCATION_TYPES = ["On-site", "Hybrid", "Remote"];

const FIELDS: JsonField[] = [
  { name: "title", label: "Title", urdu: "عہدہ" },
  { name: "employmentType", label: "Employment type", urdu: "ملازمت کی قسم", options: EMPLOYMENT_TYPES },
  { name: "companyName", label: "Company name", urdu: "کمپنی کا نام" },
  { name: "location", label: "Location", urdu: "مقام" },
  { name: "locationType", label: "Location type", urdu: "مقام کی قسم", options: LOCATION_TYPES },
  { name: "startDate", label: "Start date", urdu: "آغاز", type: "date" },
  { name: "endDate", label: "End date", urdu: "اختتام", type: "date" },
  { name: "industry", label: "Industry", urdu: "انڈسٹری" },
  { name: "description", label: "Description", urdu: "تفصیل", type: "textarea" },
];

export function ExperienceSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={Briefcase}
      title="Experience"
      titleUrdu="تجربہ"
      description="ملازمت اور پیشہ ورانہ تجربہ"
      sectionKey="experience"
      fields={FIELDS}
      summaryKeys={["title", "companyName"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
