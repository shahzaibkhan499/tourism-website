import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { relationshipCalcSchema } from "@/lib/tree-validators";
import { resolveTreeAccess } from "@/lib/tree-access";
import { buildTreeGraph } from "@/lib/tree-graph";
import { resolveRelationship } from "@/lib/relationship-names";

type RouteCtx = { params: { treeId: string } };

// POST /api/tree/[treeId]/relationship-calc — calculate rishta between 2 members
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = relationshipCalcSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { memberAId, memberBId } = parsed.data;

    const members = (await prisma.familyMember.findMany({ where: { treeId: params.treeId } })).map((m) => ({
      ...m,
      dateOfBirth: m.dateOfBirth?.toISOString() ?? null,
      dateOfDeath: m.dateOfDeath?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
    const [relationships, marriages] = await Promise.all([
      prisma.relationship.findMany({ where: { treeId: params.treeId } }),
      prisma.marriage.findMany({ where: { treeId: params.treeId } }).then((rows) =>
        rows.map((m) => ({
          ...m,
          date: m.date?.toISOString() ?? null,
          endDate: m.endDate?.toISOString() ?? null,
        }))
      ),
    ]);

    const graph = buildTreeGraph(members as any, relationships, marriages as any);
    const from = graph.memberById.get(memberAId);
    const to = graph.memberById.get(memberBId);
    if (!from || !to) return apiError(404, "ممبر نہیں ملا");

    const result = resolveRelationship(from, to, graph);
    if (!result.found) {
      return apiSuccess({
        found: false,
        message: "ان دونوں کے درمیان کوئی رشتہ نہیں ملا",
        fromMemberId: memberAId,
        toMemberId: memberBId,
      });
    }

    return apiSuccess({
      found: true,
      fromMemberId: memberAId,
      toMemberId: memberBId,
      fromName: `${from.firstName} ${from.lastName}`.trim(),
      toName: `${to.firstName} ${to.lastName}`.trim(),
      names: result.names,
      directName: result.directName,
      pathIds: result.pathIds,
      steps: result.steps,
      score: result.score,
      sameBloodline: result.sameBloodline,
      message: result.directName
        ? `${result.names[0]} — ${result.directName}`
        : result.names.join(" → "),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
