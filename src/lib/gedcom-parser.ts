// ============================================================
// GEDCOM PARSER — GEDCOM 5.5.1 line-based parser with CONT/
// CONC continuation support and @@ cross-references.
// ============================================================

export interface GedcomIndividual {
  xref: string;
  firstName: string;
  lastName: string;
  nickName: string | null;
  gender: "MALE" | "FEMALE" | null;
  dateOfBirth: string | null;
  birthPlace: string | null;
  dateOfDeath: string | null;
  deathPlace: string | null;
  occupation: string | null;
  education: string | null;
  bio: string | null;
  note: string | null;
  raw: string;
}

export interface GedcomFamily {
  xref: string;
  husbandXref: string | null;
  wifeXref: string | null;
  childXrefs: string[];
  marriageDate: string | null;
  marriagePlace: string | null;
  divorceDate: string | null;
  status: "MARRIED" | "DIVORCED" | null;
}

export interface GedcomResult {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
  source: string | null;
  encoding: string;
  warnings: string[];
}

interface GedLine {
  level: number;
  tag: string;
  value: string;
  xref: string | null;
}

function parseLine(raw: string): GedLine | null {
  const line = raw.replace(/\r$/, "");
  const m = line.match(/^(\d+)\s+(@[^@]+@\s+)?([A-Za-z0-9_]+)(?:\s(.*))?$/);
  if (!m) return null;
  const xref = m[2] ? m[2].trim().replace(/@/g, "") : null;
  return { level: Number(m[1]), tag: m[3], value: m[4] ?? "", xref };
}

function toIsoDate(v: string): string | null {
  if (!v) return null;
  const m = v.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/);
  if (m) {
    const months: Record<string, number> = {
      JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
      JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
    };
    const mo = months[m[2]];
    if (!mo) return null;
    return `${m[3]}-${String(mo).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
  }
  const m2 = v.match(/^(\d{4})$/);
  if (m2) return `${m2[1]}-01-01`;
  return null;
}

export function parseGedcom(content: string): GedcomResult {
  const warnings: string[] = [];
  const lines = content.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  const parsed: GedLine[] = [];
  for (const raw of lines) {
    const l = parseLine(raw);
    if (l) parsed.push(l);
    else warnings.push(`سطر پڑھی نہیں جا سکی: ${raw.slice(0, 60)}`);
  }

  // combine CONT/CONC continuations
  const combined: GedLine[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const l = parsed[i];
    if (l.tag === "CONT" || l.tag === "CONC") {
      if (combined.length > 0) {
        const prev = combined[combined.length - 1];
        const joiner = l.tag === "CONT" ? "\n" : "";
        prev.value = prev.value + joiner + l.value;
      }
      continue;
    }
    combined.push({ ...l });
  }

  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];
  let source: string | null = null;
  let encoding = "UTF-8";
  let curIndi: GedcomIndividual | null = null;
  let curFam: GedcomFamily | null = null;
  let inBirt = false;
  let inDeat = false;
  let inMarr = false;
  let inDiv = false;
  let pendingValue: string | null = null;

  const flushIndi = () => {
    if (curIndi) individuals.push(curIndi);
    curIndi = null;
  };
  const flushFam = () => {
    if (curFam) families.push(curFam);
    curFam = null;
  };

  for (const l of combined) {
    if (l.level === 0) {
      flushIndi();
      flushFam();
      inBirt = inDeat = inMarr = inDiv = false;
      if (l.tag === "HEAD") {
        // handled via sub-lines
      } else if (l.tag === "INDI" && l.xref) {
        curIndi = {
          xref: l.xref,
          firstName: "",
          lastName: "",
          nickName: null,
          gender: null,
          dateOfBirth: null,
          birthPlace: null,
          dateOfDeath: null,
          deathPlace: null,
          occupation: null,
          education: null,
          bio: null,
          note: null,
          raw: l.value,
        };
      } else if (l.tag === "FAM" && l.xref) {
        curFam = { xref: l.xref, husbandXref: null, wifeXref: null, childXrefs: [], marriageDate: null, marriagePlace: null, divorceDate: null, status: null };
      } else if (l.tag === "SUBM" || l.tag === "SOUR" || l.tag === "NOTE" || l.tag === "REPO" || l.tag === "OBJE") {
        // ignore top-level non-INDI records
      }
      pendingValue = null;
      continue;
    }

    if (curIndi && l.level >= 1) {
      switch (l.tag) {
        case "NAME": {
          const parts = l.value.split("/");
          curIndi.firstName = (parts[0] ?? "").trim();
          curIndi.lastName = (parts[1] ?? "").trim();
          break;
        }
        case "SEX":
          curIndi.gender = l.value === "M" ? "MALE" : l.value === "F" ? "FEMALE" : null;
          break;
        case "NICK":
          curIndi.nickName = l.value || null;
          break;
        case "OCCU":
          curIndi.occupation = l.value || null;
          break;
        case "EDUC":
          curIndi.education = l.value || null;
          break;
        case "NOTE":
          curIndi.note = l.value || null;
          break;
        case "BIRT":
          inBirt = true;
          break;
        case "DEAT":
          inDeat = true;
          break;
        case "DATE":
          if (inBirt) curIndi.dateOfBirth = toIsoDate(l.value);
          else if (inDeat) curIndi.dateOfDeath = toIsoDate(l.value);
          break;
        case "PLAC":
          if (inBirt) curIndi.birthPlace = l.value || null;
          else if (inDeat) curIndi.deathPlace = l.value || null;
          break;
        default:
          if (l.tag !== "DATE" && l.tag !== "PLAC" && !["BIRT", "DEAT", "SOUR", "CHAN", "FAMS", "FAMC", "_UID"].includes(l.tag)) {
            inBirt = inDeat = false;
          }
      }
      continue;
    }

    if (curFam && l.level >= 1) {
      switch (l.tag) {
        case "HUSB":
          curFam.husbandXref = l.value.replace(/@/g, "") || null;
          break;
        case "WIFE":
          curFam.wifeXref = l.value.replace(/@/g, "") || null;
          break;
        case "CHIL":
          curFam.childXrefs.push(l.value.replace(/@/g, ""));
          break;
        case "MARR":
          inMarr = true;
          break;
        case "DIV":
          inDiv = true;
          curFam.status = "DIVORCED";
          break;
        case "DATE":
          if (inMarr) curFam.marriageDate = toIsoDate(l.value);
          else if (inDiv) curFam.divorceDate = toIsoDate(l.value);
          break;
        case "PLAC":
          if (inMarr) curFam.marriagePlace = l.value || null;
          break;
        default:
          if (l.tag !== "DATE" && l.tag !== "PLAC" && !["MARR", "DIV", "SOUR", "CHAN", "_UID", "NOTE"].includes(l.tag)) {
            inMarr = inDiv = false;
          }
      }
      continue;
    }

    // HEAD-level metadata
    if (l.tag === "CHAR" && l.level === 1) encoding = l.value || "UTF-8";
    if (l.tag === "SOUR" && l.level === 1) source = l.value || null;
  }

  flushIndi();
  flushFam();

  if (individuals.length === 0) warnings.push("کوئی فرد (INDI) نہیں ملا");
  if (families.length === 0) warnings.push("کوئی خاندان (FAM) نہیں ملا");

  return { individuals, families, source, encoding, warnings };
}
