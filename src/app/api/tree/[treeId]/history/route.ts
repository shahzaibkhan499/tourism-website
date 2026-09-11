import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { resolveTreeAccess } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId]/history — change history (cursor paginated versions)
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const cursor = req.nextUrl.searchParams.get("cursor");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 30), 100);

    const versions = await prisma.treeVersion.findMany({
      where: { treeId: params.treeId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = versions.length > limit;
    const rows = versions.slice(0, limit);
    const userIds = Array.from(new Set(rows.map((v) => v.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return apiSuccess({
      items: rows.map((v) => ({
        id: v.id,
        treeId: v.treeId,
        action: v.action,
        user: userById.get(v.userId) ?? null,
        changes: v.changes,
        createdAt: v.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? rows[rows.length - 1]?.id ?? null : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
