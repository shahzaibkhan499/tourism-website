"use client";

import { GraduationCap } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const LEVELS = [
  "Illiterate", "Primary / Elementary", "Secondary / Junior", "High School",
  "Professional / Technical", "College", "Undergraduate / Bachelors", "MBA",
  "Masters", "Doctorate", "Ph.D.", "Post Doctorate",
];
const STUDY_TYPES = ["Full Time", "Part Time", "Night Time", "Distance Education", "Others"];
const TERMINATIONS = [
  "Still Attending", "Completed The Course / Program", "Graduated (Passed Required Examinations)",
  "Drop Out (Abandoned School / Institution)", "Expulsion From School / Institution",
  "Transfer to another School / Institution", "Other", "Unknown / Don't Know",
];

const FIELDS: JsonField[] = [
  { name: "program", label: "Program / Discipline", urdu: "پروگرام / مضمون" },
  { name: "institution", label: "Institution Name (School/College/University)", urdu: "ادارے کا نام" },
  { name: "level", label: "Education Level", urdu: "تعلیمی سطح", options: LEVELS },
  { name: "year", label: "Year", urdu: "سال" },
  { name: "studyPlace", label: "Study Place", urdu: "مقام تعلیم" },
  { name: "studyType", label: "Study Type", urdu: "طریقہ تعلیم", options: STUDY_TYPES },
  { name: "achievement", label: "Achievement", urdu: "نتیجہ", options: ["Failed", "Passed"] },
  { name: "startDate", label: "Start Date", urdu: "آغاز کی تاریخ", type: "date" },
  { name: "endDate", label: "End Date", urdu: "اختتام کی تاریخ", type: "date" },
  { name: "duration", label: "Duration", urdu: "مدت" },
  { name: "grade", label: "Grade", urdu: "گریڈ" },
  { name: "activities", label: "Activities and societies", urdu: "سرگرمیاں اور سوسائٹیز", type: "textarea" },
  { name: "termination", label: "Termination", urdu: "اختتامی حیثیت", options: TERMINATIONS },
  { name: "description", label: "Description", urdu: "تفصیل", type: "textarea" },
  { name: "comments", label: "Comments", urdu: "تبصرے", type: "textarea" },
  { name: "skills", label: "Skills (top 5)", urdu: "مہارتیں (اہم 5)", type: "textarea" },
];

export function EducationSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={GraduationCap}
      title="Education Detail"
      titleUrdu="تفصیل تعلیم"
      description="تعلیمی ادارے، سطح اور کامیابیاں"
      sectionKey="education"
      fields={FIELDS}
      summaryKeys={["program", "institution", "level"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
