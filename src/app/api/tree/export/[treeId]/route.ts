import { NextRequest } from "next/server";
import { apiError, handleApiError, requireUser } from "@/lib/api";
import { logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { exportTree } from "@/lib/tree-export";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/export/[treeId]?format=gedcom|json|pdf|png
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;

    // R8: export permission — editors always; others only when allowExport
    if (!access.canEdit && !(access.privacy?.allowExport ?? false)) {
      return apiError(403, "اس درخت کی ایکسپورٹ کی اجازت نہیں ہے");
    }

    const format = (req.nextUrl.searchParams.get("format") ?? "gedcom") as "gedcom" | "json" | "pdf" | "png";
    if (!["gedcom", "json", "pdf", "png"].includes(format)) {
      return apiError(400, "غلط فارمیٹ — gedcom، json، pdf یا png استعمال کریں");
    }

    const out = await exportTree(params.treeId, format);
    await logTreeAccess(params.treeId, user.id, `EXPORT_${format.toUpperCase()}`, req);

    return new Response(out.data as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": out.contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(out.filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
