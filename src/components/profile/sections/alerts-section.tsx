"use client";

import { BellRing } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  { name: "jobAlert", label: "Job Alert", urdu: "نوکری کی اطلاع", type: "switch" },
  { name: "marriageAlert", label: "Marriage Alert", urdu: "رشتے کی اطلاع", type: "switch" },
  { name: "dobAlert", label: "DOB Alert", urdu: "سالگرہ کی اطلاع", type: "switch" },
  { name: "eventsAlert", label: "Events Alert", urdu: "ایونٹس کی اطلاع", type: "switch" },
];

export function AlertsSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={BellRing}
      title="Alerts"
      titleUrdu="الرٹس"
      description="اطلاعات آن/آف کریں"
      sectionKey="alerts"
      fields={FIELDS}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
