import { prisma } from "@/lib/db";
import type { FamilyMember } from "@prisma/client";
import type { DuplicateCandidate } from "@/types/tree";

// ============================================================
// DUPLICATE DETECTION — scoring per spec:
// Name exact +40, fuzzy +25, DOB exact +30, same year +15,
// same parents +25, same spouse +20, same city +10.
// 80-100: Block+force merge. 60-79: Warn. <60: Allow.
// ============================================================

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Fuzzy name match: normalized similarity 0..1 via Levenshtein */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - dist / maxLen);
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'’"\-_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MatchInput {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  birthPlace: string | null;
  currentCity: string | null;
  parentIds: string[];
  spouseIds: string[];
}

export type MatchMemberRow = FamilyMember & { parentIds?: string[]; spouseIds?: string[] };

export function scoreMatch(a: MatchInput, b: MatchInput): number {
  let score = 0;
  const fullA = normalizeName(`${a.firstName} ${a.lastName}`);
  const fullB = normalizeName(`${b.firstName} ${b.lastName}`);
  const sim = nameSimilarity(fullA, fullB);

  if (sim === 1) score += 40;
  else if (sim >= 0.7) score += 25;

  if (a.dateOfBirth && b.dateOfBirth) {
    const same =
      a.dateOfBirth.getUTCFullYear() === b.dateOfBirth.getUTCFullYear() &&
      a.dateOfBirth.getUTCMonth() === b.dateOfBirth.getUTCMonth() &&
      a.dateOfBirth.getUTCDate() === b.dateOfBirth.getUTCDate();
    if (same) score += 30;
    else if (a.dateOfBirth.getUTCFullYear() === b.dateOfBirth.getUTCFullYear()) score += 15;
  }

  const sharedParents = a.parentIds.filter((p) => b.parentIds.includes(p));
  if (sharedParents.length > 0) score += 25;

  const sharedSpouses = a.spouseIds.filter((s) => b.spouseIds.includes(s));
  if (sharedSpouses.length > 0) score += 20;

  if (a.currentCity && b.currentCity && normalizeName(a.currentCity) === normalizeName(b.currentCity)) score += 10;
  if (a.birthPlace && b.birthPlace && normalizeName(a.birthPlace) === normalizeName(b.birthPlace)) score += 5;

  return Math.min(100, score);
}

export function severityFor(score: number): "BLOCK" | "WARN" | "ALLOW" {
  if (score >= 80) return "BLOCK";
  if (score >= 60) return "WARN";
  return "ALLOW";
}

/** Compare one member against all members of a tree */
export async function findDuplicateCandidates(
  treeId: string,
  member: MatchMemberRow
): Promise<DuplicateCandidate[]> {
  const [others, rels, marriages] = await Promise.all([
    prisma.familyMember.findMany({ where: { treeId, id: { not: member.id } } }),
    prisma.relationship.findMany({ where: { treeId } }),
    prisma.marriage.findMany({ where: { treeId } }),
  ]);

  const candidates: DuplicateCandidate[] = [];
  for (const o of others) {
    const parentIds = rels.filter((r) => r.childId === o.id).map((r) => r.parentId);
    const spouseIds = marriages
      .filter((m) => m.spouse1Id === o.id || m.spouse2Id === o.id)
      .map((m) => (m.spouse1Id === o.id ? m.spouse2Id : m.spouse1Id));
    const score = scoreMatch(
      {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        dateOfBirth: member.dateOfBirth,
        birthPlace: null,
        currentCity: member.currentCity,
        parentIds: member.parentIds ?? [],
        spouseIds: member.spouseIds ?? [],
      },
      {
        id: o.id,
        firstName: o.firstName,
        lastName: o.lastName,
        dateOfBirth: o.dateOfBirth,
        birthPlace: o.birthPlace,
        currentCity: o.currentCity,
        parentIds,
        spouseIds,
      }
    );
    if (score >= 60) {
      candidates.push({
        member1: serializeMember(member),
        member2: serializeMember(o),
        score,
      });
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

function serializeMember(m: Partial<FamilyMember> & { id: string }) {
  const fallback = (v: unknown): Date => (v instanceof Date ? v : new Date());
  const nn = <T,>(v: T | null | undefined): T | null => (v === undefined ? null : v);
  return {
    id: m.id,
    treeId: m.treeId ?? "",
    userId: nn(m.userId),
    firstName: m.firstName ?? "",
    lastName: m.lastName ?? "",
    nickName: nn(m.nickName),
    gender: m.gender ?? "MALE",
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
    dateOfDeath: m.dateOfDeath ? m.dateOfDeath.toISOString() : null,
    isAlive: m.isAlive ?? true,
    photo: nn(m.photo),
    birthPlace: nn(m.birthPlace),
    deathPlace: nn(m.deathPlace),
    currentCity: nn(m.currentCity),
    occupation: nn(m.occupation),
    education: nn(m.education),
    bio: nn(m.bio),
    phone: nn(m.phone),
    email: nn(m.email),
    generation: m.generation ?? 1,
    sortOrder: m.sortOrder ?? 0,
    isPrivate: m.isPrivate ?? false,
    showInPublic: m.showInPublic ?? true,
    positionX: nn(m.positionX),
    positionY: nn(m.positionY),
    createdAt: fallback(m.createdAt).toISOString(),
    updatedAt: fallback(m.updatedAt).toISOString(),
  };
}

/** Detect duplicates across the whole tree (Step 24: GET /duplicates) */
export async function detectAllDuplicates(treeId: string): Promise<DuplicateCandidate[]> {
  const [members, rels, marriages] = await Promise.all([
    prisma.familyMember.findMany({ where: { treeId } }),
    prisma.relationship.findMany({ where: { treeId } }),
    prisma.marriage.findMany({ where: { treeId } }),
  ]);

  const inputs: MatchInput[] = members.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    dateOfBirth: m.dateOfBirth,
    birthPlace: m.birthPlace,
    currentCity: m.currentCity,
    parentIds: rels.filter((r) => r.childId === m.id).map((r) => r.parentId),
    spouseIds: marriages
      .filter((x) => x.spouse1Id === m.id || x.spouse2Id === m.id)
      .map((x) => (x.spouse1Id === m.id ? x.spouse2Id : x.spouse1Id)),
  }));

  const results: DuplicateCandidate[] = [];
  for (let i = 0; i < inputs.length; i++) {
    for (let j = i + 1; j < inputs.length; j++) {
      const score = scoreMatch(inputs[i], inputs[j]);
      if (score >= 60) {
        results.push({
          member1: serializeMember(members[i]),
          member2: serializeMember(members[j]),
          score,
        });
      }
    }
  }
  return results.sort((a, b) => b.score - a.score);
}
