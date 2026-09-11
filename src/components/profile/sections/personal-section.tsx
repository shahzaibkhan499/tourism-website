"use client";

import { Sparkles } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  { name: "religion", label: "Religion", urdu: "مذہب" },
  { name: "nationalities", label: "Nationalities", urdu: "قومیت" },
  { name: "languages", label: "Languages Spoken", urdu: "زبانیں" },
  { name: "politicalViews", label: "Political Views", urdu: "سیاسی خیالات" },
  { name: "height", label: "Height", urdu: "قد" },
  { name: "weight", label: "Weight", urdu: "وزن" },
  { name: "hairColor", label: "Hair Color", urdu: "بالوں کا رنگ" },
  { name: "eyesColor", label: "Eyes Color", urdu: "آنکھوں کا رنگ" },
  { name: "physicalDescription", label: "Physical description", urdu: "جسمانی تفصیل", type: "textarea" },
];

export function PersonalSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={Sparkles}
      title="Personal Info"
      titleUrdu="ذاتی معلومات"
      description="مذہب، زبانیں اور جسمانی تفصیلات"
      sectionKey="personal"
      fields={FIELDS}
      summaryKeys={["religion", "languages", "height"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
