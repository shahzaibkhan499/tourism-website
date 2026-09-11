import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { reorderSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// PUT /api/tree/[treeId]/members/reorder — sibling reordering (sortOrder)
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const snapshot = await snapshotTree(params.treeId);

    await prisma.$transaction(
      parsed.data.items.map((item) =>
        prisma.familyMember.updateMany({
          where: { id: item.memberId, treeId: params.treeId },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    await recordVersion(params.treeId, user.id, "SIBLING_REORDER", snapshot, {
      items: parsed.data.items,
    });
    await prisma.familyTree.update({
      where: { id: params.treeId },
      data: { lastModified: new Date() },
    });
    await logTreeAccess(params.treeId, user.id, "REORDER_MEMBERS", req);

    return apiSuccess({ message: "ترتیب محفوظ ہو گئی" });
  } catch (error) {
    return handleApiError(error);
  }
}
