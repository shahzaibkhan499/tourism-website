// ============================================================
// Digital Khandaan — 1000+ NODE FAMILY TREE STRESS SEED
// Creates a dedicated stress-test account + tree with 1000+ members:
//  - 9 generations of continuous descent (spec requires 7+)
//  - polygamy: every 7th male has 3 wives (2 children each)
//  - divorces: every 9th male has a DIVORCED marriage
//  - widowed marriages, deceased members (dateOfDeath set)
//  - children linked to their SPECIFIC mother via parent relationships
// Run: npx tsx prisma/seed-1000-tree.ts
// Verify layout: npx tsx prisma/verify-1000-layout.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_EMAIL = "seed-1000@example.com";
const SEED_PASSWORD = "Seed@12345";
const TREE_NAME = "Seed 1000 — 1000+ Node Stress Tree";

const MALE_NAMES = [
  "Ahmed", "Bilal", "Danish", "Ehsan", "Faisal", "Ghulam", "Hamza", "Imran",
  "Junaid", "Kamran", "Luqman", "Muneeb", "Nadeem", "Osama", "Parvez", "Qasim",
  "Rashid", "Salman", "Tariq", "Usman", "Waqar", "Yousuf", "Zubair", "Asad",
];
const FEMALE_NAMES = [
  "Ayesha", "Bushra", "Chandni", "Dua", "Erum", "Farah", "Gulnaz", "Hira",
  "Iqra", "Javeria", "Kiran", "Lubna", "Mehwish", "Nargis", "Omaima", "Parveen",
  "Qurat", "Rabia", "Sana", "Tehmina", "Uzma", "Veeda", "Warda", "Zainab",
];

interface MemberRow {
  id: string;
  gender: "MALE" | "FEMALE";
  generation: number;
  firstName: string;
  lastName: string;
  sortOrder: number;
  dateOfBirth: Date;
  dateOfDeath: Date | null;
}

const rows: MemberRow[] = [];
const relationships: { parentId: string; childId: string }[] = [];
const marriages: {
  spouse1Id: string;
  spouse2Id: string;
  status: "MARRIED" | "DIVORCED" | "WIDOWED";
  date: Date;
  endDate: Date | null;
}[] = [];

let memberOrdinal = 0;

function makeMember(
  gender: "MALE" | "FEMALE",
  generation: number,
  dob: Date,
  sortOrder: number
): MemberRow {
  memberOrdinal += 1;
  const pool = gender === "MALE" ? MALE_NAMES : FEMALE_NAMES;
  const ord = memberOrdinal;
  const deceased = ord % 10 === 0; // every 10th member is deceased (candle test)
  const row: MemberRow = {
    id: `seed-${ord}`,
    gender,
    generation,
    firstName: pool[(ord * 7 + generation) % pool.length],
    lastName: "Khan",
    sortOrder,
    dateOfBirth: dob,
    dateOfDeath: deceased ? new Date(dob.getTime() + 70 * 365.25 * 86400000) : null,
  };
  rows.push(row);
  return row;
}

function marry(husband: MemberRow, wife: MemberRow, status: "MARRIED" | "DIVORCED" | "WIDOWED", year: number) {
  const date = new Date(year, 0, 15);
  marriages.push({
    spouse1Id: husband.id,
    spouse2Id: wife.id,
    status,
    date,
    endDate: status === "MARRIED" ? null : new Date(year + 12, 0, 15),
  });
}

function makeKids(father: MemberRow, mother: MemberRow, kidsPerWife: number, startIndex: number): MemberRow[] {
  const kids: MemberRow[] = [];
  const kidGen = father.generation + 1;
  const baseYear = 1970 - kidGen * 22;
  for (let i = 0; i < kidsPerWife; i++) {
    // 2 males : 1 female pattern so lines keep growing
    const gender = i % 3 === 2 ? "FEMALE" : "MALE";
    const kid = makeMember(gender, kidGen, new Date(baseYear + i, (i * 3) % 12, 1), startIndex + i);
    relationships.push({ parentId: father.id, childId: kid.id });
    relationships.push({ parentId: mother.id, childId: kid.id });
    kids.push(kid);
  }
  return kids;
}

async function main() {
  console.log("🌳 Seeding 1000+ node stress tree...");

  // ---------- User (upsert, idempotent) ----------
  const password = await bcrypt.hash(SEED_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { isVerified: true, isActive: true },
    create: {
      email: SEED_EMAIL,
      name: "Seed Stress User",
      password,
      role: "USER",
      isVerified: true,
      isActive: true,
      gender: "MALE",
      city: "Karachi",
      province: "Sindh",
    },
  });

  // ---------- Reset previous stress trees (idempotent re-run) ----------
  const old = await prisma.familyTree.findMany({ where: { creatorId: user.id } });
  if (old.length > 0) {
    await prisma.familyTree.deleteMany({ where: { creatorId: user.id } });
    console.log(`🧹 Deleted ${old.length} previous stress tree(s)`);
  }

  const tree = await prisma.familyTree.create({
    data: {
      name: TREE_NAME,
      description: "Automated 1000+ member stress tree (9 generations, polygamy, divorces)",
      visibility: "PRIVATE",
      isPublic: false,
      creatorId: user.id,
    },
  });

  // ---------- Generation 1: founding couple ----------
  const rootM = makeMember("MALE", 1, new Date(1930, 0, 1), 0);
  const rootF = makeMember("FEMALE", 1, new Date(1932, 2, 1), 1);
  marry(rootM, rootF, "MARRIED", 1950);

  // ---------- Generation 2: three children ----------
  const queue: MemberRow[] = makeKids(rootM, rootF, 3, 0);

  // ---------- Generations 3..9: males continue their lines ----------
  let maleOrdinal = 0;
  const maxParentGen = 8; // gen 9 parents stop — 9 generations total
  let qi = 0;
  while (qi < queue.length) {
    const person = queue[qi];
    qi += 1;
    if (person.gender !== "MALE" || person.generation > maxParentGen) continue;

    maleOrdinal += 1;
    const isPoly = maleOrdinal % 7 === 3; // every 7th male → 3 wives
    const nWives = isPoly ? 3 : 1;
    const kidsPerWife = isPoly ? 2 : 3;
    const marYear = 1965 - person.generation * 18;

    for (let k = 0; k < nWives; k++) {
      let status: "MARRIED" | "DIVORCED" | "WIDOWED" = "MARRIED";
      const divorceSlot = maleOrdinal % 9 === 5 && (isPoly ? k === 1 : k === 0);
      const widowSlot = maleOrdinal % 11 === 7 && k === 0;
      if (divorceSlot) status = "DIVORCED";
      else if (widowSlot) status = "WIDOWED";

      const wife = makeMember("FEMALE", person.generation, new Date(1968 - person.generation * 18 + k, 4, 1), 0);
      marry(person, wife, status, marYear + k);
      const kids = makeKids(person, wife, kidsPerWife, k * kidsPerWife);
      queue.push(...kids);
    }
  }

  const total = rows.length;
  const maxGen = Math.max(...rows.map((r) => r.generation));
  const polyMales = new Set(
    marriages.map((m) => m.spouse1Id)
  ).size;
  const divorced = marriages.filter((m) => m.status === "DIVORCED").length;
  const widowed = marriages.filter((m) => m.status === "WIDOWED").length;
  const deceased = rows.filter((r) => r.dateOfDeath).length;
  console.log(
    `👥 ${total} members | ${maxGen} generations | ${marriages.length} marriages ` +
    `(${divorced} divorced, ${widowed} widowed) | ${deceased} deceased | ${polyMales} married males`
  );
  if (total < 1000) throw new Error(`Seed produced only ${total} members — need 1000+`);

  // ---------- Persist ----------
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

  for (const rel of relationships) {
    await prisma.relationship.create({
      data: {
        treeId: tree.id,
        parentId: rel.parentId,
        childId: rel.childId,
        type: "BIOLOGICAL",
      },
    });
  }

  for (const m of marriages) {
    await prisma.marriage.create({
      data: {
        treeId: tree.id,
        spouse1Id: m.spouse1Id,
        spouse2Id: m.spouse2Id,
        status: m.status,
        date: m.date,
        endDate: m.endDate,
        type: "NIKKAH",
      },
    });
  }

  await prisma.treePrivacySettings.create({ data: { treeId: tree.id } });

  await prisma.familyTree.update({
    where: { id: tree.id },
    data: {
      rootMemberId: rootM.id,
      memberCount: total,
      generationCount: maxGen,
      lastModified: new Date(),
    },
  });

  console.log(`✅ Tree ready: ${tree.id}`);
  console.log(`🔑 Login: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Seed failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
