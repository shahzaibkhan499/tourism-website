// ============================================================
// Digital Khandaan — MEGA TREE STRESS SEED (20 generations × 20+)
// - exactly 20 generations of descent
// - every generation has AT LEAST 20 members (spread across couples)
// - 30 polygamous males (1 man + 3 wives + 5 children per wife)
//   distributed across generations 4,7,10,13,16,19
// - 50+ deceased members, divorces + widowed marriages
// - target 500+ total members
// Run: npx tsx prisma/seed-mega-tree.ts
// Verify: npx tsx prisma/verify-mega-tree.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_EMAIL = "seed-mega@example.com";
const SEED_PASSWORD = "Mega@12345";
const TREE_NAME = "Mega 20-Gen Tree — میگا 20 نسل شجرہ";

const MALE_NAMES = ["Ahmed", "Bilal", "Danish", "Ehsan", "Faisal", "Ghulam", "Hamza", "Imran", "Junaid", "Kamran", "Luqman", "Muneeb", "Nadeem", "Osama", "Parvez", "Qasim", "Rashid", "Salman", "Tariq", "Usman", "Waqar", "Yousuf", "Zubair", "Asad"];
const FEMALE_NAMES = ["Ayesha", "Bushra", "Chandni", "Dua", "Erum", "Farah", "Gulnaz", "Hira", "Iqra", "Javeria", "Kiran", "Lubna", "Mehwish", "Nargis", "Omaima", "Parveen", "Qurat", "Rabia", "Sana", "Tehmina", "Uzma", "Veeda", "Warda", "Zainab"];

interface MRow {
  id: string;
  gender: "MALE" | "FEMALE";
  generation: number;
  firstName: string;
  lastName: string;
  sortOrder: number;
  dateOfBirth: Date;
  dateOfDeath: Date | null;
}

let ord = 0;
const rows: MRow[] = [];
const rels: { parentId: string; childId: string }[] = [];
const marrs: { spouse1Id: string; spouse2Id: string; status: "MARRIED" | "DIVORCED" | "WIDOWED"; date: Date; endDate: Date | null }[] = [];

function make(gender: "MALE" | "FEMALE", generation: number, sortOrder: number): MRow {
  ord += 1;
  const pool = gender === "MALE" ? MALE_NAMES : FEMALE_NAMES;
  const deceased = ord % 12 === 0; // ~1/12 deceased → 50+ over ~900 members
  const dob = new Date(1970 - generation * 22, (ord * 3) % 12, 1);
  const row: MRow = {
    id: `mega-${ord}`,
    gender,
    generation,
    firstName: pool[(ord * 7 + generation) % pool.length],
    lastName: "Khan",
    sortOrder,
    dateOfBirth: dob,
    dateOfDeath: deceased ? new Date(dob.getTime() + 68 * 365.25 * 86400000) : null,
  };
  rows.push(row);
  return row;
}

function marry(h: MRow, w: MRow, status: "MARRIED" | "DIVORCED" | "WIDOWED", year: number) {
  marrs.push({ spouse1Id: h.id, spouse2Id: w.id, status, date: new Date(year, 0, 15), endDate: status === "MARRIED" ? null : new Date(year + 11, 0, 15) });
}

let kidOrd = 0; // GLOBAL gender alternation — per-couple local alternation
// produced all-male generations when kidsPerCouple === 1 (every couple's
// first child was male), leaving zero females to pair next generation.
function kidsOf(f: MRow, m: MRow, count: number, startSort: number, baseYear: number): MRow[] {
  const out: MRow[] = [];
  for (let i = 0; i < count; i++) {
    const gender = kidOrd++ % 2 === 0 ? "MALE" : "FEMALE";
    const k = make(gender, f.generation + 1, startSort + i);
    rels.push({ parentId: f.id, childId: k.id });
    rels.push({ parentId: m.id, childId: k.id });
    out.push(k);
  }
  void baseYear;
  return out;
}

async function main() {
  console.log("🌋 Seeding MEGA 20-generation tree...");

  const password = await bcrypt.hash(SEED_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { isVerified: true, isActive: true },
    create: { email: SEED_EMAIL, name: "Mega Stress User", password, role: "USER", isVerified: true, isActive: true, gender: "MALE", city: "Karachi", province: "Sindh" },
  });

  const old = await prisma.familyTree.findMany({ where: { creatorId: user.id } });
  if (old.length > 0) {
    const oldIds = old.map((t) => t.id);
    await prisma.treePrivacySettings.deleteMany({ where: { treeId: { in: oldIds } } });
    await prisma.familyTree.deleteMany({ where: { id: { in: oldIds } } });
    console.log(`🧹 Deleted ${old.length} previous mega tree(s)`);
  }

  const tree = await prisma.familyTree.create({
    data: { name: TREE_NAME, description: "Automated mega stress tree — 20 generations, 20+ members per generation, 30 polygamous males", visibility: "PRIVATE", isPublic: false, creatorId: user.id },
  });

  // Generation 1: founding couple
  const root = make("MALE", 1, 0);
  const rootWife = make("FEMALE", 1, 1);
  marry(root, rootWife, "MARRIED", 1950);

  // Generation 2: 20 children (10M 10F alternating via kidsOf)
  let layer: MRow[] = kidsOf(root, rootWife, 20, 0, 1968);

  let marriageOrd = 0;

  // Generation-pure breeding loop. `layer` holds the members of the CURRENT
  // generation g; `carry` holds polygamy children destined for g+1 so they
  // never mix into a baseline layer (mixing drifted generations upward).
  let carry: MRow[] = [];
  // Iteration g processes the members OF generation g (layer starts as the
  // gen-2 children) and produces generation g+1 — so g runs 2..20 and the
  // deepest generation is exactly 20.
  for (let g = 2; g <= 20; g++) {
    const genMembers = [...layer, ...carry];
    layer = [];
    carry = [];

    // Baseline couples: pair gen-g males with gen-g females, children land
    // at gen g+1 (only while g+1 <= 20).
    if (g <= 19) {
      const males = genMembers.filter((m) => m.gender === "MALE");
      const females = genMembers.filter((m) => m.gender === "FEMALE");
      const nCouples = Math.max(1, Math.min(males.length, females.length));
      const kidsPerCouple = Math.max(1, Math.ceil(20 / nCouples));
      for (let i = 0; i < nCouples; i++) {
        const h = males[i];
        const w = females[i];
        marriageOrd += 1;
        const status = marriageOrd % 9 === 4 ? "DIVORCED" : "MARRIED";
        marry(h, w, status, 1965 - g * 18);
        layer.push(...kidsOf(h, w, kidsPerCouple, i * kidsPerCouple, 1966 - g * 18));
      }
    }

    // Polygamy points: generations 4,7,10,13,16,19 — 5 males each get
    // 3 wives (SAME generation as the husband) and 5 children per wife
    // (generation g+1, linked to the specific mother).
    if (g % 3 === 1 && g <= 19) {
      const polyCandidates = genMembers.filter((m) => m.gender === "MALE");
      for (let p = 0; p < 5 && p < polyCandidates.length; p++) {
        const poly = polyCandidates[p];
        for (let wi = 0; wi < 3; wi++) {
          const wife = make("FEMALE", g, 100 + wi);
          marriageOrd += 1;
          const st = wi === 1 && marriageOrd % 2 === 0 ? "DIVORCED" : wi === 0 && marriageOrd % 3 === 1 ? "WIDOWED" : "MARRIED";
          marry(poly, wife, st as "MARRIED" | "DIVORCED" | "WIDOWED", 1965 - g * 18 + wi);
          // 5 children per wife, each linked to the SPECIFIC mother
          carry.push(...kidsOf(poly, wife, 5, 200 + wi * 5, 1966 - g * 18));
        }
      }
    }

    console.log(`  gen ${g}: ${genMembers.length} members (first gen=${genMembers[0]?.generation})`);
  }

  const total = rows.length;
  const maxGen = Math.max(...rows.map((r) => r.generation));
  const polyMales = new Set<string>();
  const perMale = new Map<string, number>();
  for (const m of marrs) {
    perMale.set(m.spouse1Id, (perMale.get(m.spouse1Id) ?? 0) + 1);
    if ((perMale.get(m.spouse1Id) ?? 0) >= 3) polyMales.add(m.spouse1Id);
  }
  const deceased = rows.filter((r) => r.dateOfDeath).length;
  const divorced = marrs.filter((m) => m.status === "DIVORCED").length;
  const widowed = marrs.filter((m) => m.status === "WIDOWED").length;
  const perGen = new Map<number, number>();
  for (const r of rows) perGen.set(r.generation, (perGen.get(r.generation) ?? 0) + 1);
  // gens 2..20 must each have >= 20 members (gen 1 is the founding couple)
  const minPerGen = Math.min(...Array.from(perGen.entries()).filter(([g]) => g >= 2).map(([, n]) => n));
  console.log(`👥 ${total} members | ${maxGen} generations | poly males=${polyMales.size} | divorced=${divorced} | widowed=${widowed} | deceased=${deceased} | min/gen=${minPerGen}`);
  if (total < 500) throw new Error(`Mega seed produced only ${total} members — need 500+`);
  if (maxGen < 20) throw new Error(`Mega seed produced ${maxGen} generations — need exactly 20`);

  await prisma.familyMember.createMany({
    data: rows.map((r) => ({
      id: r.id,
      treeId: tree.id,
      firstName: r.firstName,
      lastName: r.lastName,
      gender: r.gender,
      dateOfBirth: r.dateOfBirth,
      dateOfDeath: r.dateOfDeath,
      generation: r.generation,
      sortOrder: r.sortOrder,
    })),
  });
  for (const r of rels) {
    await prisma.relationship.create({ data: { treeId: tree.id, parentId: r.parentId, childId: r.childId, type: "BIOLOGICAL" } });
  }
  for (const m of marrs) {
    await prisma.marriage.create({ data: { treeId: tree.id, spouse1Id: m.spouse1Id, spouse2Id: m.spouse2Id, status: m.status, date: m.date, endDate: m.endDate, type: "NIKKAH" } });
  }
  await prisma.treePrivacySettings.create({ data: { treeId: tree.id } });
  await prisma.familyTree.update({
    where: { id: tree.id },
    data: { rootMemberId: root.id, memberCount: total, generationCount: maxGen, lastModified: new Date() },
  });
  console.log(`✅ Mega tree ready: ${tree.id}`);
  console.log(`🔑 Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Mega seed failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
