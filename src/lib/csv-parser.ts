// ============================================================
// CSV PARSER — family member CSV import with column mapping.
// Supports quoted fields, CRLF, BOM, auto-detected delimiter,
// auto-mapping of common Urdu/English column names.
// ============================================================

export type CsvMemberField =
  | "firstName"
  | "lastName"
  | "nickName"
  | "gender"
  | "dateOfBirth"
  | "dateOfDeath"
  | "isAlive"
  | "birthPlace"
  | "deathPlace"
  | "currentCity"
  | "occupation"
  | "education"
  | "bio"
  | "phone"
  | "email"
  | "fatherName"
  | "motherName"
  | "spouseName";

export interface CsvColumnMap {
  [key: string]: CsvMemberField;
}

export interface CsvParseResult {
  headers: string[];
  rows: Record<CsvMemberField, string | null>[];
  delimiter: string;
  autoMap: CsvColumnMap;
  warnings: string[];
}

const KNOWN_HEADERS: Record<string, CsvMemberField> = {
  firstname: "firstName",
  "first name": "firstName",
  first_name: "firstName",
  نام: "firstName",
  name: "firstName",
  lastname: "lastName",
  "last name": "lastName",
  last_name: "lastName",
  surname: "lastName",
  familyname: "lastName",
  "خاندانی نام": "lastName",
  nickname: "nickName",
  nick: "nickName",
  عرفیت: "nickName",
  gender: "gender",
  sex: "gender",
  جنس: "gender",
  dateofbirth: "dateOfBirth",
  dob: "dateOfBirth",
  birthdate: "dateOfBirth",
  "تاریخ پیدائش": "dateOfBirth",
  پیدائش: "dateOfBirth",
  dateofdeath: "dateOfDeath",
  dod: "dateOfDeath",
  deathdate: "dateOfDeath",
  "تاریخ وفات": "dateOfDeath",
  وفات: "dateOfDeath",
  isalive: "isAlive",
  alive: "isAlive",
  زندہ: "isAlive",
  birthplace: "birthPlace",
  "جائے پیدائش": "birthPlace",
  deathplace: "deathPlace",
  "جائے وفات": "deathPlace",
  currentcity: "currentCity",
  city: "currentCity",
  شہر: "currentCity",
  "موجودہ شہر": "currentCity",
  occupation: "occupation",
  job: "occupation",
  پیشہ: "occupation",
  education: "education",
  تعلیم: "education",
  bio: "bio",
  biography: "bio",
  تعارف: "bio",
  phone: "phone",
  mobile: "phone",
  فون: "phone",
  email: "email",
  "ای میل": "email",
  fathername: "fatherName",
  father: "fatherName",
  "والد کا نام": "fatherName",
  والد: "fatherName",
  mothername: "motherName",
  mother: "motherName",
  "والدہ کا نام": "motherName",
  والدہ: "motherName",
  spousename: "spouseName",
  spouse: "spouseName",
  "شریک حیات": "spouseName",
  "شریک حیات کا نام": "spouseName",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\s]+/g, "").replace(/[،,]/g, "");
}

export function parseCsv(content: string): CsvParseResult {
  const warnings: string[] = [];
  const text = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (text.trim().length === 0) {
    return { headers: [], rows: [], delimiter: ",", autoMap: {}, warnings: ["فائل خالی ہے"] };
  }

  const delimiter = text.includes("\t") ? "\t" : text.includes(";") ? ";" : ",";
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  const splitRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const headers = splitRow(lines[0]).map((h) => h.trim()).filter((h, i, arr) => h !== "" || arr.length > 1);
  const autoMap: CsvColumnMap = {};
  for (const h of headers) {
    const field = KNOWN_HEADERS[normalizeHeader(h)];
    if (field) autoMap[h] = field;
  }
  if (Object.keys(autoMap).length === 0) {
    warnings.push("کالم خودکار طریقے سے نہیں پہچانے جا سکے — مینوئل میپنگ کریں");
  }

  const rows: Record<CsvMemberField, string | null>[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = splitRow(lines[li]);
    if (cells.length === 1 && cells[0].trim() === "") continue;
    const row = {} as Record<CsvMemberField, string | null>;
    for (const f of Object.values(autoMap)) row[f] = null;
    headers.forEach((h, i) => {
      const field = autoMap[h];
      if (field) {
        const v = (cells[i] ?? "").trim();
        row[field] = v === "" ? null : v;
      }
    });
    if (Object.values(row).every((v) => v === null)) continue;
    rows.push(row);
  }

  if (rows.length === 0) warnings.push("کوئی ممبر قطار نہیں ملی");

  return { headers, rows, delimiter, autoMap, warnings };
}

export function guessGender(value: string | null): "MALE" | "FEMALE" | null {
  if (!value) return null;
  const v = normalizeHeader(value);
  if (["m", "male", "مرد", "مذکر", "لڑکا"].includes(v)) return "MALE";
  if (["f", "female", "خاتون", "عورت", "مونث", "لڑکی"].includes(v)) return "FEMALE";
  return null;
}

export function parseFlexibleDate(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const mdy = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  const yearOnly = v.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function guessIsAlive(value: string | null): boolean | null {
  if (!value) return null;
  const v = normalizeHeader(value);
  if (["yes", "y", "true", "1", "زندہ", "جی", "ہاں", "haan", "jee"].includes(v)) return true;
  if (["no", "n", "false", "0", "فوت", "نہیں", "nahi", "مرحوم", "وفات"].includes(v)) return false;
  return null;
}
