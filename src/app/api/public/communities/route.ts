import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

// Public endpoint: communities + clans + basic stats for the landing page
export async function GET(_req: NextRequest) {
  try {
    const communities = await prisma.community.findMany({
      where: { isActive: true },
      include: {
        clans: {
          where: { isActive: true },
          include: { _count: { select: { members: true } } },
          orderBy: { name: "asc" },
          take: 12,
        },
      },
      orderBy: { name: "asc" },
    });

    const stats = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.event.count(),
      prisma.clan.count({ where: { isActive: true } }),
      prisma.memory.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.rishtaProfile.count({ where: { isActive: true } }),
    ]);

    return apiSuccess({
      communities,
      stats: {
        users: stats[0],
        events: stats[1],
        clans: stats[2],
        memories: stats[3],
        businesses: stats[4],
        rishtaProfiles: stats[5],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
