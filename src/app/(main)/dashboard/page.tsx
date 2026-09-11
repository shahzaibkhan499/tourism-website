import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, eventsCreated, memoriesCount, unreadNotifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        clan: {
          select: {
            id: true,
            name: true,
            nameUrdu: true,
            _count: { select: { members: true } },
          },
        },
      },
    }),
    prisma.event.count({ where: { creatorId: userId } }),
    prisma.memory.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      date: { gte: new Date() },
      OR: [{ creatorId: userId }, { isPublic: true }],
    },
    orderBy: { date: "asc" },
    take: 5,
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { rsvps: true } },
    },
  });

  // Recent activity
  const [recentEvents, recentMemories, recentMedia] = await Promise.all([
    prisma.event.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, url: true, createdAt: true, type: true },
    }),
  ]);

  const activities = [
    ...recentEvents.map((e) => ({
      id: `event-${e.id}`,
      type: "event" as const,
      title: `ایونٹ بنایا: ${e.title}`,
      createdAt: e.createdAt,
      link: `/events/${e.id}`,
    })),
    ...recentMemories.map((m) => ({
      id: `memory-${m.id}`,
      type: "memory" as const,
      title: `یاد محفوظ کی: ${m.title}`,
      createdAt: m.createdAt,
      link: `/memories`,
    })),
    ...recentMedia.map((m) => ({
      id: `media-${m.id}`,
      type: "media" as const,
      title: `میڈیا اپ لوڈ کیا`,
      createdAt: m.createdAt,
      link: `/media`,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <DashboardContent
      user={{
        id: user?.id ?? userId,
        name: user?.name ?? "Member",
        email: user?.email ?? "",
        image: user?.image ?? null,
        createdAt: user?.createdAt?.toISOString() ?? new Date().toISOString(),
        clan: user?.clan
          ? { name: user.clan.name, nameUrdu: user.clan.nameUrdu, memberCount: user.clan._count.members }
          : null,
      }}
      stats={{
        eventsCreated,
        clanMembers: user?.clan?._count.members ?? 0,
        memoriesCount,
        unreadNotifications,
      }}
      upcomingEvents={upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date.toISOString(),
        location: e.location,
        creatorName: e.creator.name,
        rsvpCount: e._count.rsvps,
      }))}
      activities={activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        createdAt: a.createdAt.toISOString(),
        link: a.link,
      }))}
    />
  );
}
