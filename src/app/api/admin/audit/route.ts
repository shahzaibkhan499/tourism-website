import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity") || "";
    const action = searchParams.get("action") || "";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = 50;

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action, mode: "insensitive" };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { id: true, name: true } } },
      }),
    ]);

    return apiSuccess({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
