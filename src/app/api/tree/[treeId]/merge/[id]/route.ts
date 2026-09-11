import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { mergeRespondSchema } from "@/lib/tree-validators";
import { logTreeAccess, recordVersion, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";
import { buildMergePlan, executeTreeMerge } from "@/lib/tree-merge";

type RouteCtx = { params: { treeId: string; id: string } };

// PUT /api/tree/[treeId]/merge/[id] — approve/reject a merge request (target owner)
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    if (!access.canDelete) return apiError(403, "صرف مالک ہی انضمام منظور کر سکتا ہے");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = mergeRespondSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const request = await prisma.treeMergeRequest.findFirst({
      where: { id: params.id, targetTreeId: params.treeId },
    });
    if (!request) return apiError(404, "انضمام کی درخواست نہیں ملی");
    if (request.status !== "PENDING") return apiError(400, "یہ درخواست پہلے ہی مکمل ہو چکی ہے");

    if (!parsed.data.approve) {
      await prisma.treeMergeRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED", respondedAt: new Date() },
      });
      await logTreeAccess(params.treeId, user.id, "MERGE_REJECTED", req);
      return apiSuccess({ message: "انضمام مسترد کر دیا گیا", status: "REJECTED" });
    }

    const before = await snapshotTree(params.treeId);
    const plan = await buildMergePlan(request.sourceTreeId, params.treeId);
    const mergeMap: Record<string, string> = {};
    for (const c of plan.common) mergeMap[c.sourceMemberId] = c.targetMemberId;
    // user-provided mergeMap overrides/adds
    if (request.mergeMap && typeof request.mergeMap === "object") {
      const extra = request.mergeMap as Record<string, unknown>;
      for (const [k, v] of Object.entries(extra)) {
        if (typeof v === "string") mergeMap[k] = v;
      }
    }

    const result = await executeTreeMerge(request.sourceTreeId, params.treeId, mergeMap);

    await prisma.treeMergeRequest.update({
      where: { id: request.id },
      data: { status: "MERGED", respondedAt: new Date() },
    });

    await recordVersion(params.treeId, user.id, "TREE_MERGE", before, {
      sourceTreeId: request.sourceTreeId,
      copiedMembers: result.copiedMembers,
      createdRelationships: result.createdRelationships,
      createdMarriages: result.createdMarriages,
    });
    await logTreeAccess(params.treeId, user.id, "MERGE_APPROVED", req);

    return apiSuccess({
      message: "درخت ملا دیے گئے ✓",
      status: "MERGED",
      copiedMembers: result.copiedMembers,
      createdRelationships: result.createdRelationships,
      createdMarriages: result.createdMarriages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
