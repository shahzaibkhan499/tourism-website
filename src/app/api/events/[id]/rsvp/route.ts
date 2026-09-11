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

    const { status, guests, note } = parsed.data;

    const rsvp = await prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: id, userId: user.id } },
      update: { status, guests, note },
      create: { eventId: id, userId: user.id, status, guests, note },
    });

    return apiSuccess(rsvp);
  } catch (error) {
    return handleApiError(error);
  }
}
