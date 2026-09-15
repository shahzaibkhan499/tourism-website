import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { eventSchema, eventQuerySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser, auditLog, getIp } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";
import { getEventTypeInfo } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = eventQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { type, from, to, location, isPublic, cursor, limit } = parsed.data;

    const where: any = {
      OR: [{ creatorId: user.id }, { isPublic: true }],
    };
    if (type) where.type = type;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }
    if (isPublic !== undefined) where.isPublic = isPublic === "true";

    const events = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        creator: { select: { id: true, name: true, image: true } },
        rsvps: {
          select: { userId: true, status: true },
        },
        _count: { select: { rsvps: true } },
      },
    });

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;

    const result = items.map((e) => ({
      ...e,
      rsvpCount: e.rsvps.filter((r) => r.status === "GOING").length,
      myRsvp: e.rsvps.find((r) => r.userId === user.id)?.status ?? null,
      rsvps: undefined,
    }));

    return apiSuccess({
      items: result,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { title, type, date, endDate, time, location, latitude, longitude, hijriDate, description, coverImage, isPublic, isRecurring, recurringPattern, details, invitees } =
      parsed.data;

    // Combine date and time if provided
    let eventDate = new Date(date);
    if (time && /^\d{1,2}:\d{2}/.test(time)) {
      const [hours, minutes] = time.split(":").map(Number);
      eventDate = new Date(eventDate);
      eventDate.setHours(hours || 0, minutes || 0, 0, 0);
    }

    const event = await prisma.event.create({
      data: {
        title: sanitizeInput(title),
        type: type as never,
        date: eventDate,
        endDate: endDate ? new Date(endDate) : null,
        location: location ? sanitizeInput(location) : null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        hijriDate: hijriDate || null,
        description: description || null,
        coverImage: coverImage || null,
        isPublic,
        isRecurring,
        recurringPattern: recurringPattern || null,
        details: (details ?? undefined) as Prisma.InputJsonValue | undefined,
        invitees: invitees?.length ? Array.from(new Set(invitees.filter((x) => x !== user.id))) : undefined,
        creatorId: user.id,
      },
    });

    await auditLog(user.id, "CREATE_EVENT", "Event", event.id, { title: event.title }, getIp(req.headers));

    // Round 10 — invitees get a notification that opens the digital invitation card
    const inviteeIds = invitees?.filter((x) => x !== user.id) ?? [];
    if (inviteeIds.length > 0) {
      const typeLabel = getEventTypeInfo(type).label;
      await prisma.notification.createMany({
        data: inviteeIds.map((userId) => ({
          userId,
          type: "event_invite",
          title: `آپ کو مدعو کیا گیا — ${event.title}`,
          message: `${user.name ?? "Koi"} ne aap ko "${event.title}" (${typeLabel}) mein shamil kiya hai. Digital card kholein aur apna jawab dein.`,
          link: `/events/${event.id}/invite`,
        })),
      });
    }

    return apiSuccess(event, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
