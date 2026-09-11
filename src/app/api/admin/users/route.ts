import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const clan = searchParams.get("clan") || "";
    const city = searchParams.get("city") || "";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = 20;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;
    if (status === "banned") where.isBanned = true;
    if (status === "active") where.isBanned = false;
    if (status === "unverified") where.isVerified = false;
    if (clan) where.clanId = clan;
    if (city) where.city = { contains: city, mode: "insensitive" };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          isBanned: true,
          isVerified: true,
          isActive: true,
          city: true,
          createdAt: true,
          banReason: true,
          clan: { select: { id: true, name: true } },
          _count: { select: { events: true, memories: true, reports: true } },
        },
      }),
    ]);

    return apiSuccess({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
