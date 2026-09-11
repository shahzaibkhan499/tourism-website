import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { mergeRequestSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { buildMergePlan } from "@/lib/tree-merge";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId]/merge — list merge requests + preview of common members for a target
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const targetId = req.nextUrl.searchParams.get("targetTreeId");
    let plan = null;
    if (targetId && targetId !== params.treeId) {
      const target = await prisma.familyTree.findUnique({ where: { id: targetId }, select: { id: true, creatorId: true, name: true } });
      if (!target) return apiError(404, "ہدف والا درخت نہیں ملا");
      if (target.creatorId !== user.id) return apiError(403, "صرف اپنے درختوں میں ملا سکتے ہیں");
      plan = await buildMergePlan(params.treeId, targetId);
    }

    const incoming = await prisma.treeMergeRequest.findMany({
      where: { targetTreeId: params.treeId },
      orderBy: { createdAt: "desc" },
      include: {
        sourceTree: { select: { id: true, name: true } },
      },
    });
    const outgoing = await prisma.treeMergeRequest.findMany({
      where: { sourceTreeId: params.treeId },
      orderBy: { createdAt: "desc" },
      include: {
        targetTree: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({
      preview: plan
        ? {
            targetTreeId: targetId,
            commonCount: plan.common.length,
            copyCount: plan.copyCount,
            common: plan.common,
          }
        : null,
      incoming: incoming.map((r) => ({
        id: r.id,
        sourceTreeId: r.sourceTreeId,
        sourceTreeName: r.sourceTree.name,
        status: r.status,
        commonMembers: r.commonMembers,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
        respondedAt: r.respondedAt?.toISOString() ?? null,
      })),
      outgoing: outgoing.map((r) => ({
        id: r.id,
        targetTreeId: r.targetTreeId,
        targetTreeName: r.targetTree.name,
        status: r.status,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
        respondedAt: r.respondedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/merge — request tree merge into target
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = mergeRequestSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { targetTreeId, message, mergeMap } = parsed.data;

    if (targetTreeId === params.treeId) return apiError(400, "درخت اپنے آپ میں ملا نہیں سکتے");
    const target = await prisma.familyTree.findUnique({ where: { id: targetTreeId }, select: { id: true, creatorId: true } });
    if (!target) return apiError(404, "ہدف والا درخت نہیں ملا");

    const plan = await buildMergePlan(params.treeId, targetTreeId);

    const request = await prisma.treeMergeRequest.create({
      data: {
        sourceTreeId: params.treeId,
        targetTreeId,
        requesterId: user.id,
        status: "PENDING",
        commonMembers: JSON.parse(JSON.stringify({ count: plan.common.length, items: plan.common })),
        mergeMap: mergeMap ? JSON.parse(JSON.stringify(mergeMap)) : null,
        message: message ? sanitizeInput(message) : null,
      },
    });

    await logTreeAccess(params.treeId, user.id, "MERGE_REQUESTED", req);

    return apiSuccess(
      {
        message: "انضمام کی درخواست بھیج دی گئی",
        request: { id: request.id, status: request.status, commonCount: plan.common.length },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
