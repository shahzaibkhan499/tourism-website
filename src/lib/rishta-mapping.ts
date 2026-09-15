/**
 * Shared mapping between the overhauled 12-section Rishta form input
 * (validated by rishtaProfileFields) and the RishtaProfile DB columns.
 *
 * The top-level scalar columns (age, education, profession, sect, ...) keep the
 * directory search filters working, while formDetails stores the complete
 * 12-section structure exactly as filled by the form.
 */
import type { RishtaFormDetails, RishtaProfileFields } from "@/lib/validators";

const BUILD_LABELS: Record<string, string> = {
  SLIM: "Slim",
  MEDIUM: "Medium",
  HEALTHY: "Healthy",
};

const SECT_LABELS: Record<string, string> = {
  SUNNI: "Sunni",
  SHIA: "Shia",
};

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export function buildLabel(build: string | null | undefined): string | null {
  return build ? (BUILD_LABELS[build] ?? build) : null;
}

export function sectLabel(sect: string | null | undefined): string | null {
  return sect ? (SECT_LABELS[sect] ?? sect) : null;
}

/** Highest qualification = last non-empty entry in the multi-entry education list. */
export function highestQualification(
  entries: RishtaFormDetails["education"] | undefined
): string | null {
  if (!entries?.length) return null;
  for (let i = entries.length - 1; i >= 0; i--) {
    const q = entries[i]?.qualification?.trim();
    if (q) return q;
  }
  return null;
}

/** Human summary of the education entries, e.g. "Matric — Govt HS; Bachelors — NUST". */
export function educationSummary(
  entries: RishtaFormDetails["education"] | undefined
): string | null {
  if (!entries?.length) return null;
  const parts: string[] = [];
  for (const e of entries) {
    if (!e) continue;
    const q = e.qualification?.trim();
    if (!q) continue;
    const inst = [e.university, e.college, e.school].map((s) => s?.trim()).find(Boolean);
    parts.push(inst ? `${q} — ${inst}` : q);
  }
  return parts.length ? parts.join("; ") : null;
}

/** Contact person other than SELF behaves as the guardian of the profile. */
export function contactToGuardian(fd: RishtaFormDetails) {
  const c = fd.contact ?? {};
  const isGuardian = c.relation != null && c.relation !== "SELF" && Boolean(c.personName);
  return {
    isGuardianMode: isGuardian,
    guardianName: isGuardian ? c.personName ?? null : null,
    guardianRelation: isGuardian ? c.relation ?? null : null,
    guardianPhone: isGuardian ? c.mobile ?? null : null,
  };
}

/** Columns derived from formDetails (kept in sync on every write). */
export function derivedColumns(fd: RishtaFormDetails): Record<string, unknown> {
  const g = contactToGuardian(fd);
  return {
    age: ageFromDob(fd.personal?.dateOfBirth),
    complexion: buildLabel(fd.physical?.build),
    education: highestQualification(fd.education),
    educationDetail: educationSummary(fd.education),
    profession: fd.job?.nature?.trim() || fd.job?.company?.trim() || null,
    sect: sectLabel(fd.religion?.sect),
    castePreference: fd.partner?.caste ?? null,
    cityPreference: fd.partner?.city ?? null,
    countryPreference: "Pakistan",
    expectations: fd.partner?.otherRequirements ?? null,
    isGuardianMode: g.isGuardianMode,
    guardianName: g.guardianName,
    guardianRelation: g.guardianRelation,
    guardianPhone: g.guardianPhone,
  };
}

/**
 * Full input (POST / upsert) → all columns to write.
 * Explicit top-level form values win over derived ones.
 */
export function mapRishtaInput(d: RishtaProfileFields) {
  const derived = derivedColumns(d.formDetails);
  return {
    ...derived,
    maritalStatus: d.maritalStatus,
    children: d.children,
    height: d.height ?? null,
    weight: d.weight != null ? String(d.weight) : null,
    income: d.income ?? null,
    maslak: d.maslak ?? null,
    about: d.about ?? null,
    familyBackground: d.familyBackground ?? null,
    castePreference: d.castePreference ?? derived.castePreference,
    cityPreference: d.cityPreference ?? derived.cityPreference,
    photos: d.photos ?? [],
    isGuardianMode: d.isGuardianMode || (derived.isGuardianMode as boolean),
    guardianName: d.guardianName ?? derived.guardianName,
    guardianRelation: d.guardianRelation ?? derived.guardianRelation,
    guardianPhone: d.guardianPhone ?? derived.guardianPhone,
    formDetails: d.formDetails as unknown as Record<string, unknown>,
  };
}
