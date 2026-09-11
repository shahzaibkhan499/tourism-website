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

// ============================================================
// POST /api/tree/[treeId]/redo — redo the last undo.
// An UNDO version row stores the snapshot of the state that was
// undone (the "before" of the undo), so redo restores that snapshot.
// ============================================================
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

    // classic redo: only allowed when the latest version action is an UNDO
    // (if new edits happened after the undo, redo is rejected)
    const latest = await prisma.treeVersion.findFirst({
      where: { treeId: params.treeId },
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true },
    });
    if (!latest || latest.action !== "UNDO") {
      return apiError(400, "ریڈو کے لیے کوئی تبدیلی نہیں — پہلے Undo کریں");
    }

    const version = await prisma.treeVersion.findUnique({
      where: { id: latest.id },
    });
    if (!version || !version.snapshot) return apiError(400, "اس ورژن کا اسنیپ شاٹ موجود نہیں");

    const before = await snapshotTree(params.treeId);
    await restoreSnapshot(params.treeId, version.snapshot);
    await recordVersion(params.treeId, user.id, "REDO", before, {
      restoredVersionId: version.id,
      restoredAction: version.action,
    });
    // consume the undone version so redo can't be repeated against it
    await prisma.treeVersion.delete({ where: { id: version.id } });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "REDO", req);

    return apiSuccess({
      message: "تبدیلی دوبارہ لاگو کر دی گئی (Redo)",
      restoredVersionId: version.id,
      note: "نوٹ: صرف اسنیپ شاٹ میں موجود ممبرز اور رشتے بحال ہوئے — بعد میں بنائے گئے نئے ممبرز کو دستی طور پر چیک کریں",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
