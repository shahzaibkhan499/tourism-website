"use client";

import { Flower2 } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  { name: "date", label: "Date of Death", urdu: "تاریخ وفات", type: "date" },
  { name: "place", label: "Place of Death", urdu: "جائے وفات" },
  { name: "causeOfDeath", label: "Cause of Death", urdu: "وجہ وفات" },
];

export function DeathSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={Flower2}
      title="Death"
      titleUrdu="وفات"
      description="مرحوم خاندانی ممبر کی معلومات"
      sectionKey="death"
      fields={FIELDS}
      summaryKeys={["date", "place"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
