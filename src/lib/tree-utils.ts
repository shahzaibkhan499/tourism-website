import type {
  LayoutDirection,
  MarriageStatus,
  RelationshipType,
  TreeMarriageDto,
  TreeMemberDto,
} from "@/types/tree";

// ============================================================
// FAMILY TREE — shared constants + formatting helpers
// Node visual design per spec: 180x90px, gender borders,
// deceased styling, link colors, dot-grid background.
// ============================================================

export const NODE_W = 180;
export const NODE_H = 90;
export const H_GAP = 60; // horizontal gap between node boxes
export const V_GAP = 80; // vertical gap between generations
export const ROOT_GAP = 90; // gap between separate root subtrees
export const SLOT = NODE_W + H_GAP;
export const LEVEL = NODE_H + V_GAP;

export const GENDER_COLORS: Record<string, string> = {
  MALE: "#3b82f6",
  FEMALE: "#ec4899",
};
export const DECEASED_COLOR = "#9ca3af";
export const SELECTED_COLOR = "#16a34a";
export const MARRIAGE_COLOR = "#f472b6";
export const DOT_GRID_COLOR = "#e5e7eb";

export const REL_TYPE_META: Record<
  RelationshipType,
  { label: string; urdu: string; stroke: string; dash: string }
> = {
  BIOLOGICAL: { label: "Biological", urdu: "حقیقی", stroke: "#16a34a", dash: "" },
  ADOPTED: { label: "Adopted", urdu: "لے پالک", stroke: "#3b82f6", dash: "6,4" },
  STEP: { label: "Step", urdu: "سوتیلا", stroke: "#f97316", dash: "2,4" },
  GUARDIAN: { label: "Guardian", urdu: "سرپرست", stroke: "#a78bfa", dash: "8,4,2,4" },
  FOSTER: { label: "Foster", urdu: "رضاعی", stroke: "#5eead4", dash: "1,5" },
};

export const MARRIAGE_STATUS_META: Record<
  MarriageStatus,
  { label: string; urdu: string; color: string }
> = {
  MARRIED: { label: "Married", urdu: "شادی شدہ", color: MARRIAGE_COLOR },
  DIVORCED: { label: "Divorced", urdu: "طلاق", color: "#9ca3af" },
  WIDOWED: { label: "Widowed", urdu: "بیوہ/بیوہ ہوئی", color: "#9ca3af" },
  SEPARATED: { label: "Separated", urdu: "علیحدہ", color: "#d1d5db" },
  ENGAGED: { label: "Engaged", urdu: "منگنی", color: "#fbcfe8" },
};

export const LIFETIME_EVENT_META: Record<
  string,
  { label: string; urdu: string; emoji: string }
> = {
  BIRTH: { label: "Birth", urdu: "پیدائش", emoji: "👶" },
  AQEEQA: { label: "Aqeeqa", urdu: "عقیقہ", emoji: "🍖" },
  BISMILLAH: { label: "Bismillah", urdu: "بسم اللہ", emoji: "📖" },
  KHATAM_QURAN: { label: "Khatam Quran", urdu: "ختم قرآن", emoji: "📿" },
  SCHOOL_ADMISSION: { label: "School Admission", urdu: "اسکول میں داخلہ", emoji: "🎒" },
  GRADUATION: { label: "Graduation", urdu: "گریجویشن", emoji: "🎓" },
  FIRST_JOB: { label: "First Job", urdu: "پہلی نوکری", emoji: "💼" },
  ENGAGEMENT: { label: "Engagement", urdu: "منگنی", emoji: "💍" },
  NIKKAH: { label: "Nikkah", urdu: "نکاح", emoji: "💒" },
  WALIMA: { label: "Walima", urdu: "ولیمہ", emoji: "🍽️" },
  HAJJ: { label: "Hajj", urdu: "حج", emoji: "🕋" },
  UMRAH: { label: "Umrah", urdu: "عمرہ", emoji: "🕋" },
  CHILD_BIRTH: { label: "Child Birth", urdu: "اولاد کی پیدائش", emoji: "🤱" },
  JOB_CHANGE: { label: "Job Change", urdu: "نوکری کی تبدیلی", emoji: "🔄" },
  PROMOTION: { label: "Promotion", urdu: "ترقی", emoji: "📈" },
  RETIREMENT: { label: "Retirement", urdu: "ریٹائرمنٹ", emoji: "🕰️" },
  HOUSE_PURCHASE: { label: "House Purchase", urdu: "گھر کی خریداری", emoji: "🏠" },
  MIGRATION: { label: "Migration", urdu: "ہجرت", emoji: "✈️" },
  ILLNESS: { label: "Illness", urdu: "بیماری", emoji: "🤒" },
  SURGERY: { label: "Surgery", urdu: "آپریشن", emoji: "🏥" },
  DEATH: { label: "Death", urdu: "وفات", emoji: "🕯️" },
  FUNERAL: { label: "Funeral", urdu: "جنازہ", emoji: "⚰️" },
  OTHER: { label: "Other", urdu: "دیگر", emoji: "📌" },
};

export function fullName(m: Pick<TreeMemberDto, "firstName" | "lastName">): string {
  return `${m.firstName}${m.lastName ? " " + m.lastName : ""}`.trim() || "—";
}

export function initials(m: Pick<TreeMemberDto, "firstName" | "lastName">): string {
  const f = m.firstName?.trim().charAt(0).toUpperCase() ?? "";
  const l = m.lastName?.trim().charAt(0).toUpperCase() ?? "";
  return (f + l) || "؟";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

export function birthYear(m: TreeMemberDto): number | null {
  return m.dateOfBirth ? new Date(m.dateOfBirth).getFullYear() : null;
}

export function isDeceased(m: Pick<TreeMemberDto, "isAlive" | "dateOfDeath">): boolean {
  return !m.isAlive || Boolean(m.dateOfDeath);
}

export function ageOf(m: TreeMemberDto, at?: Date): number | null {
  if (!m.dateOfBirth) return null;
  const start = new Date(m.dateOfBirth);
  const end = m.dateOfDeath ? new Date(m.dateOfDeath) : at ?? new Date();
  let age = end.getFullYear() - start.getFullYear();
  const mDiff = end.getMonth() - start.getMonth();
  if (mDiff < 0 || (mDiff === 0 && end.getDate() < start.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

/** Stable sibling sort per spec: sortOrder → DOB oldest-first → gender (males first, toggleable) → relationship type → first name */
export function sortSiblings(
  childIds: string[],
  memberById: Map<string, TreeMemberDto>,
  relTypeOf: (childId: string, parentId: string) => RelationshipType,
  parentId: string,
  malesFirst: boolean
): string[] {
  const typeRank: Record<RelationshipType, number> = {
    BIOLOGICAL: 0,
    ADOPTED: 1,
    STEP: 2,
    GUARDIAN: 3,
    FOSTER: 4,
  };
  return [...childIds].sort((a, b) => {
    const ma = memberById.get(a);
    const mb = memberById.get(b);
    if (!ma || !mb) return 0;
    if (ma.sortOrder !== mb.sortOrder) return ma.sortOrder - mb.sortOrder;
    const da = ma.dateOfBirth ? new Date(ma.dateOfBirth).getTime() : null;
    const db = mb.dateOfBirth ? new Date(mb.dateOfBirth).getTime() : null;
    if (da !== db) {
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db; // oldest first (leftmost)
    }
    if (malesFirst && ma.gender !== mb.gender) return ma.gender === "MALE" ? -1 : 1;
    const ta = typeRank[relTypeOf(a, parentId)] ?? 0;
    const tb = typeRank[relTypeOf(b, parentId)] ?? 0;
    if (ta !== tb) return ta - tb;
    return fullName(ma).localeCompare(fullName(mb), "en", { sensitivity: "base" });
  });
}

/** Family key from a sorted parent id set */
export function familyKey(parentIds: string[]): string {
  return [...parentIds].sort().join("|");
}

export function sortMarriages(marriages: TreeMarriageDto[]): TreeMarriageDto[] {
  return [...marriages].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    const da = a.date ? new Date(a.date).getTime() : null;
    const db = b.date ? new Date(b.date).getTime() : null;
    if (da && db && da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

export function directionLabel(d: LayoutDirection): { en: string; ur: string } {
  switch (d) {
    case "TB":
      return { en: "Top → Bottom", ur: "اوپر سے نیچے" };
    case "BT":
      return { en: "Bottom → Top", ur: "نیچے سے اوپر" };
    case "LR":
      return { en: "Left → Right", ur: "بائیں سے دائیں" };
    case "RL":
      return { en: "Right → Left", ur: "دائیں سے بائیں" };
  }
}

export function memberLabel(m: TreeMemberDto): string {
  return `${fullName(m)}${birthYear(m) ? ` (b.${birthYear(m)})` : ""}`;
}
