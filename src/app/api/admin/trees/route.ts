import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

// ============================================================
// GET /api/admin/trees — platform-wide family tree list (management)
// DELETE /api/admin/trees — delete trees by ?ids=id1,id2
// ============================================================

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 100);

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { creator: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const trees = await prisma.familyTree.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true,
        name: true,
        visibility: true,
        isPublic: true,
        memberCount: true,
        generationCount: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { id: true, email: true, name: true } },
      },
    });

    const hasMore = trees.length > limit;
    const items = hasMore ? trees.slice(0, limit) : trees;
    return apiSuccess({
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      total: await prisma.familyTree.count({ where }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const ids = (searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return apiError(400, "درختوں کی شناخت ضروری ہے");

    const result = await prisma.familyTree.deleteMany({ where: { id: { in: ids } } });
    for (const id of ids) {
      await auditLog(admin.id, "ADMIN_DELETE_TREE", "FamilyTree", id, {}, getIp(req.headers));
    }
    return apiSuccess({ deleted: result.count, message: `${result.count} درخت حذف ہو گئے` });
  } catch (error) {
    return handleApiError(error);
  }
}
