import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rsvpSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("NOT_FOUND");

    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { status, guests, note, message } = parsed.data;

    const rsvp = await prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: id, userId: user.id } },
      update: { status, guests, note, message },
      create: { eventId: id, userId: user.id, status, guests, note, message },
    });

    // Round 10 — notify the creator of the response (and its message/dua)
    if (event.creatorId !== user.id) {
      const statusLabel = status === "GOING" ? "shirkat ki tasdeeq ki" : status === "MAYBE" ? "shayad jayenge" : "nahi aa sakte";
      await prisma.notification.create({
        data: {
          userId: event.creatorId,
          type: "rsvp_update",
          title: `${user.name ?? "Koi"} ne RSVP de di — ${event.title}`,
          message: message
            ? `${user.name ?? "Koi"} ne ${statusLabel} aur kaha: "${message.slice(0, 120)}${message.length > 120 ? "…" : ""}"`
            : `${user.name ?? "Koi"} ne ${event.title} ke liye ${statusLabel}.`,
          link: `/events/${id}`,
        },
      });
    }

    return apiSuccess(rsvp);
  } catch (error) {
    return handleApiError(error);
  }
}
