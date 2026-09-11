import { prisma } from "@/lib/db";
import { nameSimilarity } from "@/lib/duplicate-detection";

// ============================================================
// TREE MERGE — Scenario D:
// find common members (name + DOB±2yrs + parents), score 0-100;
// show >70% matches for confirmation; merge data and re-link
// relationships through transactions.
// ============================================================

export interface MergeCommonMember {
  sourceMemberId: string;
  targetMemberId: string;
  sourceName: string;
  targetName: string;
  score: number;
  matchedBy: string[];
}

export interface MergePlan {
  common: MergeCommonMember[];
  sourceOnly: string[]; // member ids to copy
  copyCount: number;
  linkCount: number;
}

export async function buildMergePlan(sourceTreeId: string, targetTreeId: string): Promise<MergePlan> {
  const [sourceMembers, targetMembers] = await Promise.all([
    prisma.familyMember.findMany({
      where: { treeId: sourceTreeId },
      include: {
        parentRelations: true,
        childRelations: true,
        spouse1Relations: true,
        spouse2Relations: true,
      },
    }),
    prisma.familyMember.findMany({
      where: { treeId: targetTreeId },
      include: {
        parentRelations: true,
        childRelations: true,
        spouse1Relations: true,
        spouse2Relations: true,
      },
    }),
  ]);

  const common: MergeCommonMember[] = [];
  const sourceOnly: string[] = [];

  for (const sm of sourceMembers) {
    let best: { t: (typeof targetMembers)[number]; score: number; matchedBy: string[] } | null = null;
    for (const tm of targetMembers) {
      const matchedBy: string[] = [];
      let score = 0;
      const nameSim = nameSimilarity(sm.firstName, tm.firstName);
      if (sm.firstName === tm.firstName) {
        score += 40;
        matchedBy.push("نام");
      } else if (nameSim >= 0.7) {
        score += 25;
        matchedBy.push("ملتا جلتا نام");
      }
      if (sm.lastName && tm.lastName && sm.lastName === tm.lastName) score += 5;
      if (sm.dateOfBirth && tm.dateOfBirth) {
        const diff = Math.abs(new Date(sm.dateOfBirth).getTime() - new Date(tm.dateOfBirth).getTime());
        const years = diff / (365.25 * 24 * 3600 * 1000);
        if (years <= 2) {
          score += 30;
          matchedBy.push("تاریخ پیدائش ±2 سال");
        }
      }
      const spParents = new Set(sm.parentRelations.map((r) => r.parentId));
      const tpParents = new Set(tm.parentRelations.map((r) => r.parentId));
      const sharedParents = Array.from(spParents).filter((p) => tpParents.has(p));
      if (sharedParents.length > 0) {
        score += 25;
        matchedBy.push("مشترکہ والدین");
      }
      if (!best || score > best.score) best = { t: tm, score, matchedBy };
    }
    if (best && best.score >= 70) {
      common.push({
        sourceMemberId: sm.id,
        targetMemberId: best.t.id,
        sourceName: `${sm.firstName} ${sm.lastName}`.trim(),
        targetName: `${best.t.firstName} ${best.t.lastName}`.trim(),
        score: best.score,
        matchedBy: best.matchedBy,
      });
    } else {
      sourceOnly.push(sm.id);
    }
  }

  return {
    common,
    sourceOnly,
    copyCount: sourceOnly.length,
    linkCount: common.length,
  };
}

export interface MergeExecuteResult {
  copiedMembers: number;
  createdRelationships: number;
  createdMarriages: number;
  mergedIds: string[];
}

export async function executeTreeMerge(
  sourceTreeId: string,
  targetTreeId: string,
  mergeMap: Record<string, string>,
  options: { skipPrivate?: boolean } = {}
): Promise<MergeExecuteResult> {
  const result: MergeExecuteResult = { copiedMembers: 0, createdRelationships: 0, createdMarriages: 0, mergedIds: [] };

  await prisma.$transaction(async (tx) => {
    const sourceMembers = await tx.familyMember.findMany({
      where: { treeId: sourceTreeId },
      include: {
        parentRelations: true,
        spouse1Relations: true,
        spouse2Relations: true,
      },
    });

    // id map: source member id -> target tree member id
    const idMap = new Map<string, string>(Object.entries(mergeMap));

    // Pass 1: copy members that have no target mapping
    for (const m of sourceMembers) {
      if (idMap.has(m.id)) continue;
      if (options.skipPrivate && m.isPrivate) continue;
      const created = await tx.familyMember.create({
        data: {
          treeId: targetTreeId,
          userId: m.userId,
          firstName: m.firstName,
          lastName: m.lastName,
          nickName: m.nickName,
          gender: m.gender,
          dateOfBirth: m.dateOfBirth,
          dateOfDeath: m.dateOfDeath,
          isAlive: m.isAlive,
          photo: m.photo,
          birthPlace: m.birthPlace,
          deathPlace: m.deathPlace,
          currentCity: m.currentCity,
          occupation: m.occupation,
          education: m.education,
          bio: m.bio,
          phone: m.phone,
          email: m.email,
          generation: m.generation,
          sortOrder: m.sortOrder,
          isPrivate: m.isPrivate,
          showInPublic: m.showInPublic,
          positionX: m.positionX,
          positionY: m.positionY,
        },
      });
      idMap.set(m.id, created.id);
      result.copiedMembers += 1;
    }

    const resolve = (sourceId: string) => idMap.get(sourceId);

    // Pass 2: re-link parent-child relationships
    const existingPairs = new Set<string>();
    const existingTargetRels = await tx.relationship.findMany({ where: { treeId: targetTreeId } });
    for (const r of existingTargetRels) existingPairs.add(`${r.parentId}|${r.childId}`);

    for (const m of sourceMembers) {
      const childId = resolve(m.id);
      if (!childId) continue;
      for (const pr of m.parentRelations) {
        const parentId = resolve(pr.parentId);
        if (!parentId) continue;
        const key = `${parentId}|${childId}`;
        if (existingPairs.has(key)) continue;
        await tx.relationship.create({
          data: { treeId: targetTreeId, parentId, childId, type: pr.type },
        });
        existingPairs.add(key);
        result.createdRelationships += 1;
      }
    }

    // Pass 3: marriages between mapped spouses
    const existingMarriages = new Set<string>();
    const targetMarriages = await tx.marriage.findMany({ where: { treeId: targetTreeId } });
    for (const m of targetMarriages) existingMarriages.add(`${m.spouse1Id}|${m.spouse2Id}`);

    for (const m of sourceMembers) {
      const marriages = [...m.spouse1Relations, ...m.spouse2Relations];
      for (const mar of marriages) {
        const s1 = resolve(mar.spouse1Id);
        const s2 = resolve(mar.spouse2Id);
        if (!s1 || !s2) continue;
        const key = `${s1}|${s2}`;
        const key2 = `${s2}|${s1}`;
        if (existingMarriages.has(key) || existingMarriages.has(key2)) continue;
        await tx.marriage.create({
          data: {
            treeId: targetTreeId,
            spouse1Id: s1,
            spouse2Id: s2,
            date: mar.date,
            endDate: mar.endDate,
            location: mar.location,
            status: mar.status,
            type: mar.type,
            sortOrder: mar.sortOrder,
          },
        });
        existingMarriages.add(key);
        result.createdMarriages += 1;
      }
    }

    // Pass 4: copy life events, stories, group photos of mapped/copied members
    for (const m of sourceMembers) {
      const targetMemberId = resolve(m.id);
      if (!targetMemberId) continue;
      const events = await tx.memberLifeEvent.findMany({ where: { memberId: m.id } });
      for (const ev of events) {
        await tx.memberLifeEvent.create({
          data: {
            memberId: targetMemberId,
            type: ev.type,
            title: ev.title,
            description: ev.description,
            date: ev.date,
            location: ev.location,
            photo: ev.photo,
            source: ev.source,
            verifiedBy: ev.verifiedBy,
          },
        });
      }
      const stories = await tx.memberStory.findMany({ where: { memberId: m.id } });
      for (const st of stories) {
        await tx.memberStory.create({
          data: {
            memberId: targetMemberId,
            userId: st.userId,
            title: st.title,
            content: st.content,
            language: st.language,
            isPublic: st.isPublic,
          },
        });
      }
      result.mergedIds.push(targetMemberId);
    }
  });

  return result;
}
