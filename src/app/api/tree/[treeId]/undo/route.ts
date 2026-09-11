import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import {
  assertCanEdit,
  logTreeAccess,
  recordVersion,
  refreshTreeStats,
  resolveTreeAccess,
  restoreSnapshot,
  snapshotTree,
} from "@/lib/tree-access";
import { z } from "zod";

type RouteCtx = { params: { treeId: string } };

const bodySchema = z.object({
  versionId: z.string().min(1).optional(),
});

// POST /api/tree/[treeId]/undo — undo to a previous version (or latest if versionId omitted)
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const version = await prisma.treeVersion.findFirst({
      where: {
        treeId: params.treeId,
        ...(parsed.data.versionId ? { id: parsed.data.versionId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!version) return apiError(404, "پچھلا ورژن نہیں ملا");
    if (!version.snapshot) return apiError(400, "اس ورژن کا اسنیپ شاٹ موجود نہیں");

    const before = await snapshotTree(params.treeId);
    await restoreSnapshot(params.treeId, version.snapshot);
    await recordVersion(params.treeId, user.id, "UNDO", before, {
      restoredVersionId: version.id,
      restoredAction: version.action,
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "UNDO", req);

    return apiSuccess({
      message: "تبدیلی واپس کر دی گئی (Undo)",
      restoredVersionId: version.id,
      restoredAction: version.action,
      note: "نوٹ: صرف اسنیپ شاٹ میں موجود ممبرز اور رشتے بحال ہوئے — بعد میں بنائے گئے نئے ممبرز کو دستی طور پر چیک کریں",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
