import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { resolveTreeAccess } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId]/stats — tree statistics (counts, demographics, charts data)
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const [members, relationships, marriages, comments, lifeEvents, stories, photos, collaborators] =
      await Promise.all([
        prisma.familyMember.findMany({
          where: { treeId: params.treeId },
          select: {
            id: true,
            gender: true,
            isAlive: true,
            dateOfBirth: true,
            dateOfDeath: true,
            generation: true,
            currentCity: true,
            occupation: true,
            birthPlace: true,
          },
        }),
        prisma.relationship.count({ where: { treeId: params.treeId } }),
        prisma.marriage.findMany({ where: { treeId: params.treeId }, select: { status: true } }),
        prisma.memberComment.count({ where: { member: { treeId: params.treeId } } }),
        prisma.memberLifeEvent.count({ where: { member: { treeId: params.treeId } } }),
        prisma.memberStory.count({ where: { member: { treeId: params.treeId } } }),
        prisma.groupPhoto.count({ where: { treeId: params.treeId } }),
        prisma.treeCollaborator.count({ where: { treeId: params.treeId } }),
      ]);

    const total = members.length;
    const males = members.filter((m) => m.gender === "MALE").length;
    const females = total - males;
    const living = members.filter((m) => m.isAlive && !m.dateOfDeath).length;
    const deceased = total - living;
    const generations = Array.from(new Set(members.map((m) => m.generation))).sort((a, b) => a - b);
    const maxGeneration = generations.length ? Math.max(...generations) : 1;

    // generation histogram
    const generationHistogram = generations.map((g) => ({
      generation: g,
      count: members.filter((m) => m.generation === g).length,
    }));

    // gender by generation
    const genderByGeneration = generations.map((g) => {
      const gens = members.filter((m) => m.generation === g);
      return {
        generation: g,
        male: gens.filter((m) => m.gender === "MALE").length,
        female: gens.length - gens.filter((m) => m.gender === "MALE").length,
      };
    });

    // top cities
    const cityCount = new Map<string, number>();
    for (const m of members) {
      const c = (m.currentCity ?? m.birthPlace ?? "").trim();
      if (c) cityCount.set(c, (cityCount.get(c) ?? 0) + 1);
    }
    const topCities = Array.from(cityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));

    // top occupations
    const occCount = new Map<string, number>();
    for (const m of members) {
      const o = (m.occupation ?? "").trim();
      if (o) occCount.set(o, (occCount.get(o) ?? 0) + 1);
    }
    const topOccupations = Array.from(occCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([occupation, count]) => ({ occupation, count }));

    // decade-of-birth histogram
    const decadeCount = new Map<string, number>();
    for (const m of members) {
      if (!m.dateOfBirth) continue;
      const y = new Date(m.dateOfBirth).getFullYear();
      const decade = `${Math.floor(y / 10) * 10}s`;
      decadeCount.set(decade, (decadeCount.get(decade) ?? 0) + 1);
    }
    const birthDecades = Array.from(decadeCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([decade, count]) => ({ decade, count }));

    const marriageByStatus = (["MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "ENGAGED"] as const).map((status) => ({
      status,
      count: marriages.filter((m) => m.status === status).length,
    }));

    // average lifespan
    const lifespans: number[] = [];
    for (const m of members) {
      if (m.dateOfBirth && m.dateOfDeath) {
        const years = (new Date(m.dateOfDeath).getTime() - new Date(m.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000);
        if (years >= 0 && years <= 130) lifespans.push(Math.round(years * 10) / 10);
      }
    }
    const averageLifespan = lifespans.length
      ? Math.round((lifespans.reduce((a, b) => a + b, 0) / lifespans.length) * 10) / 10
      : null;

    return apiSuccess({
      totals: {
        members: total,
        males,
        females,
        living,
        deceased,
        generations: maxGeneration,
        relationships,
        marriages: marriages.length,
        comments,
        lifeEvents,
        stories,
        photos,
        collaborators,
      },
      generationHistogram,
      genderByGeneration,
      topCities,
      topOccupations,
      birthDecades,
      marriageByStatus,
      averageLifespan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
