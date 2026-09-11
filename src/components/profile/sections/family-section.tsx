"use client";

import { Users } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  { name: "husbandWife", label: "Husband / Wife Name", urdu: "شریک حیات کا نام" },
  { name: "anniversaryDate", label: "Anniversary Date", urdu: "شادی کی سالگرہ", type: "date" },
  { name: "fatherName", label: "Father Name", urdu: "والد کا نام" },
  { name: "motherName", label: "Mother Name", urdu: "والدہ کا نام" },
  { name: "grandFatherName", label: "Grand Father Name", urdu: "دادا کا نام" },
  { name: "grandMotherName", label: "Grand Mother Name", urdu: "دادی کا نام" },
  { name: "brothersName", label: "Brothers Name", urdu: "بھائیوں کے نام" },
  { name: "sistersName", label: "Sisters Name", urdu: "بہنوں کے نام" },
  { name: "sonName", label: "Son Name", urdu: "بیٹوں کے نام" },
  { name: "daughterName", label: "Daughter Name", urdu: "بیٹیوں کے نام" },
  { name: "fatherInLaw", label: "Father In Law", urdu: "سسر کا نام" },
  { name: "motherInLaw", label: "Mother In Law", urdu: "ساس کا نام" },
  { name: "brotherInLaw", label: "Brother In Law", urdu: "سالے کا نام" },
  { name: "sisterInLaw", label: "Sister In Law", urdu: "سالی کا نام" },
];

export function FamilySection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={Users}
      title="Family Member"
      titleUrdu="خاندانی ممبر"
      description="Part II — Khawaja Family Member کی تفصیلات"
      sectionKey="family"
      fields={FIELDS}
      summaryKeys={["fatherName", "motherName", "husbandWife"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
