import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { notificationQuerySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = notificationQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { tab, cursor, limit } = parsed.data;

    const where: any = { userId: user.id };
    if (tab === "unread") where.isRead = false;
    if (tab && tab !== "all" && tab !== "unread") where.type = tab;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;

    return apiSuccess({
      notifications: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { id } = body as { id?: string };

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });
      return apiSuccess({ message: "Notification read ho gayi" });
    }

    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return apiSuccess({ message: "Sab notifications read ho gayin" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const user = await requireUser();
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    return apiSuccess({ message: "Sab notifications delete ho gayin" });
  } catch (error) {
    return handleApiError(error);
  }
}
