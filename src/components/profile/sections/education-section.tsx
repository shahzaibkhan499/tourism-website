"use client";

import { GraduationCap } from "lucide-react";
import { SectionCard } from "./section-card";

interface EduEntry {
  degree: string;
  institute: string;
  year: string;
}

/**
 * Multi-entry education list (User.educations JSON array).
 * Editing happens in the main "پروفائل میں ترمیم" dialog (useFieldArray),
 * which is opened via the onEdit prop.
 */
export function EducationSection({ profile, onEdit }: { profile: any; onEdit: () => void }) {
  const educations: EduEntry[] = Array.isArray(profile?.educations) ? profile.educations : [];
  const summary = educations
    .filter((e) => e.degree || e.institute)
    .map((e) => [e.degree, e.year].filter(Boolean).join(" · "))
    .join("   |   ");

  return (
    <SectionCard
      icon={GraduationCap}
      title="Education"
      titleUrdu="تعلیم"
      description="تعلیمی درجہ، ادارے کا نام، سال"
      summary={summary || undefined}
      onEdit={onEdit}
    >
      {educations.length > 1 && (
        <div className="mt-3 space-y-1.5">
          {educations.map((e, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
              <span className="truncate text-gray-700">
                {e.degree || "—"}
                {e.institute ? <span className="text-gray-500"> — {e.institute}</span> : null}
              </span>
              {e.year && <span className="shrink-0 text-xs text-gray-400">{e.year}</span>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
