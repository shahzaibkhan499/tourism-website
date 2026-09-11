import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { eventSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser, auditLog, getIp } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, image: true, city: true },
        },
        rsvps: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!event) throw new Error("NOT_FOUND");
    if (!event.isPublic && event.creatorId !== user.id) throw new Error("FORBIDDEN");

    const going = event.rsvps.filter((r) => r.status === "GOING");
    const maybe = event.rsvps.filter((r) => r.status === "MAYBE");
    const notGoing = event.rsvps.filter((r) => r.status === "NOT_GOING");
    const myRsvp = event.rsvps.find((r) => r.userId === user.id) ?? null;

    return apiSuccess({
      ...event,
      counts: { going: going.length, maybe: maybe.length, notGoing: notGoing.length },
      attendees: going.map((r) => r.user),
      myRsvp: myRsvp ? { status: myRsvp.status, guests: myRsvp.guests, note: myRsvp.note } : null,
      rsvps: undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("NOT_FOUND");
    if (event.creatorId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    const body = await req.json();
    const parsed = eventSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const data: any = {};
    if (parsed.data.title !== undefined) data.title = sanitizeInput(parsed.data.title);
    if (parsed.data.type !== undefined) data.type = parsed.data.type;
    if (parsed.data.date !== undefined) {
      const d = new Date(parsed.data.date);
      if (parsed.data.time && /^\d{1,2}:\d{2}/.test(parsed.data.time)) {
        const [hours, minutes] = parsed.data.time.split(":").map(Number);
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) d.setHours(hours, minutes, 0, 0);
      }
      data.date = d;
    }
    if (parsed.data.endDate !== undefined) data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    if (parsed.data.location !== undefined) data.location = parsed.data.location ? sanitizeInput(parsed.data.location) : null;
    if (parsed.data.hijriDate !== undefined) data.hijriDate = parsed.data.hijriDate;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.coverImage !== undefined) data.coverImage = parsed.data.coverImage;
    if (parsed.data.isPublic !== undefined) data.isPublic = parsed.data.isPublic;
    if (parsed.data.isRecurring !== undefined) data.isRecurring = parsed.data.isRecurring;
    if (parsed.data.recurringPattern !== undefined) data.recurringPattern = parsed.data.recurringPattern;

    const updated = await prisma.event.update({ where: { id }, data });

    await auditLog(user.id, "UPDATE_EVENT", "Event", id, { title: updated.title }, getIp(req.headers));

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("NOT_FOUND");
    if (event.creatorId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    await prisma.event.delete({ where: { id } });

    await auditLog(user.id, "DELETE_EVENT", "Event", id, { title: event.title }, getIp(req.headers));

    return apiSuccess({ message: "ایونٹ ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
