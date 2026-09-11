import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { marriageUpdateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string; id: string } };

// PUT /api/tree/[treeId]/marriages/[id] — update marriage (divorce, date, status)
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const marriage = await prisma.marriage.findFirst({
      where: { id: params.id, treeId: params.treeId },
    });
    if (!marriage) return apiError(404, "شادی نہیں ملی");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = marriageUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const d = parsed.data;

    const snapshot = await snapshotTree(params.treeId);

    const updated = await prisma.marriage.update({
      where: { id: params.id },
      data: {
        ...(d.date !== undefined ? { date: d.date } : {}),
        ...(d.endDate !== undefined ? { endDate: d.endDate } : {}),
        ...(d.location !== undefined ? { location: d.location } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.type !== undefined ? { type: d.type } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
    });

    await recordVersion(params.treeId, user.id, "MARRIAGE_UPDATE", snapshot, {
      marriageId: params.id,
      fields: Object.keys(d),
      status: updated.status,
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "EDIT_MARRIAGE", req);

    return apiSuccess({ message: "شادی اپ ڈیٹ ہو گئی", marriage: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId]/marriages/[id] — remove marriage
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const marriage = await prisma.marriage.findFirst({
      where: { id: params.id, treeId: params.treeId },
    });
    if (!marriage) return apiError(404, "شادی نہیں ملی");

    const snapshot = await snapshotTree(params.treeId);
    await prisma.marriage.delete({ where: { id: params.id } });

    await recordVersion(params.treeId, user.id, "MARRIAGE_REMOVE", snapshot, {
      marriageId: params.id,
      spouse1Id: marriage.spouse1Id,
      spouse2Id: marriage.spouse2Id,
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "REMOVE_MARRIAGE", req);

    return apiSuccess({ message: "شادی کا ریکارڈ ختم کر دیا گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
