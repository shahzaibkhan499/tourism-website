"use client";

import { HeartHandshake } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  { name: "fatherName", label: "Father Name", urdu: "والد کا نام" },
  { name: "motherName", label: "Mother Name", urdu: "والدہ کا نام" },
  { name: "husbandWife", label: "Husband / Wife Name", urdu: "شریک حیات کا نام" },
  { name: "anniversaryDate", label: "Anniversary Date", urdu: "شادی کی سالگرہ", type: "date" },
  { name: "fatherInLaw", label: "Father In Law", urdu: "سسر کا نام" },
  { name: "cast", label: "Cast", urdu: "ذات" },
  { name: "motherInLaw", label: "Mother In Law", urdu: "ساس کا نام" },
  { name: "brotherInLaw", label: "Brother In Law", urdu: "سالے کا نام" },
  { name: "sisterInLaw", label: "Sister In Law", urdu: "سالی کا نام" },
  { name: "sonName", label: "Son Name", urdu: "بیٹوں کے نام" },
  { name: "daughterName", label: "Daughter Name", urdu: "بیٹیوں کے نام" },
];

export function RelationSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={HeartHandshake}
      title="Family Relation"
      titleUrdu="خاندانی رشتے"
      description="Part II B — Khawaja Family Relation کی تفصیلات"
      sectionKey="relations"
      fields={FIELDS}
      summaryKeys={["fatherName", "husbandWife"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
