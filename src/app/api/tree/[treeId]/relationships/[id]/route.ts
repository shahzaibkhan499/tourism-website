import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";
import { z } from "zod";

type RouteCtx = { params: { treeId: string; id: string } };

const updateSchema = z.object({
  type: z.enum(["BIOLOGICAL", "ADOPTED", "STEP", "GUARDIAN", "FOSTER"]),
});

// DELETE /api/tree/[treeId]/relationships/[id] — remove parent-child relationship
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const rel = await prisma.relationship.findFirst({
      where: { id: params.id, treeId: params.treeId },
    });
    if (!rel) return apiError(404, "رشتہ نہیں ملا");

    const snapshot = await snapshotTree(params.treeId);
    await prisma.relationship.delete({ where: { id: params.id } });

    await recordVersion(params.treeId, user.id, "RELATIONSHIP_REMOVE", snapshot, {
      relationshipId: params.id,
      parentId: rel.parentId,
      childId: rel.childId,
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "REMOVE_RELATIONSHIP", req);

    return apiSuccess({ message: "رشتہ ختم کر دیا گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/tree/[treeId]/relationships/[id] — change relationship type
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const rel = await prisma.relationship.findFirst({
      where: { id: params.id, treeId: params.treeId },
    });
    if (!rel) return apiError(404, "رشتہ نہیں ملا");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const updated = await prisma.relationship.update({
      where: { id: params.id },
      data: { type: parsed.data.type },
    });

    await recordVersion(params.treeId, user.id, "RELATIONSHIP_UPDATE", { before: rel.type }, {
      relationshipId: params.id,
      type: parsed.data.type,
    });
    await prisma.familyTree.update({ where: { id: params.treeId }, data: { lastModified: new Date() } });
    await logTreeAccess(params.treeId, user.id, "EDIT_RELATIONSHIP", req);

    return apiSuccess({ message: "رشتے کی قسم بدل گئی", relationship: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
