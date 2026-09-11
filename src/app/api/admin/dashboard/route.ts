import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalUsers,
      totalEvents,
      totalClans,
      totalBusinesses,
      totalRishtaProfiles,
      pendingReports,
      usersLastMonth,
      eventsLastMonth,
      clansLastMonth,
      businessesLastMonth,
      rishtaLastMonth,
      reportsLastMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.clan.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isActive: true } }),
      prisma.rishtaProfile.count({ where: { isActive: true } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
      prisma.event.count({ where: { createdAt: { gte: lastMonth } } }),
      prisma.clan.count({ where: { isActive: true, createdAt: { gte: lastMonth } } }),
      prisma.business.count({ where: { isActive: true, createdAt: { gte: lastMonth } } }),
      prisma.rishtaProfile.count({ where: { isActive: true, createdAt: { gte: lastMonth } } }),
      prisma.report.count({ where: { createdAt: { gte: lastMonth } } }),
    ]);

    // User growth: last 12 months
    const usersByMonth = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: twelveMonthsAgo } },
    });
    const userGrowth: Array<{ month: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = usersByMonth.filter((u) => u.createdAt >= monthStart && u.createdAt < monthEnd).length;
      userGrowth.push({ month: monthStart.toLocaleString("en", { month: "short" }), count });
    }

    // Events per month
    const eventsByMonth = await prisma.event.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: twelveMonthsAgo } },
    });
    const eventsMonthly: Array<{ month: string; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = eventsByMonth.filter((e) => e.createdAt >= monthStart && e.createdAt < monthEnd).length;
      eventsMonthly.push({ month: monthStart.toLocaleString("en", { month: "short" }), count });
    }

    // Clan distribution by community
    const clanDistribution = await prisma.community.findMany({
      where: { isActive: true },
      select: {
        name: true,
        clans: { select: { _count: { select: { members: true } } } },
      },
    });

    // Recent reports + users
    const [recentReports, recentUsers] = await Promise.all([
      prisma.report.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          reporter: { select: { id: true, name: true } },
          reported: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, email: true, createdAt: true, isVerified: true },
      }),
    ]);

    return apiSuccess({
      stats: {
        totalUsers,
        totalEvents,
        totalClans,
        totalBusinesses,
        totalRishtaProfiles,
        pendingReports,
      },
      changes: {
        users: totalUsers - usersLastMonth > 0 ? usersLastMonth : 0,
        events: eventsLastMonth,
        clans: clansLastMonth,
        businesses: businessesLastMonth,
        rishtaProfiles: rishtaLastMonth,
        reports: reportsLastMonth,
      },
      userGrowth,
      eventsMonthly,
      clanDistribution: clanDistribution.map((c) => ({
        name: c.name,
        members: c.clans.reduce((sum, cl) => sum + cl._count.members, 0),
      })),
      recentReports,
      recentUsers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
