import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { inviteSchema } from "@/lib/validators";
import { getEventTypeInfo } from "@/lib/constants";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

// Round 10 — creator invites more users to an existing event (digital card)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("NOT_FOUND");
    if (event.creatorId !== user.id) throw new Error("FORBIDDEN");

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const existing: string[] = Array.isArray(event.invitees) ? (event.invitees as string[]) : [];
    const invitees = Array.from(new Set([...existing, ...parsed.data.invitees].filter((x) => x !== user.id)));

    await prisma.event.update({ where: { id }, data: { invitees } });

    const newInvitees = parsed.data.invitees.filter((x) => !existing.includes(x) && x !== user.id);
    if (newInvitees.length > 0) {
      const typeLabel = getEventTypeInfo(event.type).label;
      await prisma.notification.createMany({
        data: newInvitees.map((userId) => ({
          userId,
          type: "event_invite",
          title: `آپ کو مدعو کیا گیا — ${event.title}`,
          message: `${user.name ?? "Koi"} ne aap ko "${event.title}" (${typeLabel}) mein shamil kiya hai. Digital card kholein aur apna jawab dein.`,
          link: `/events/${id}/invite`,
        })),
      });
    }

    return apiSuccess({ invited: newInvitees.length, totalInvitees: invitees.length });
  } catch (error) {
    return handleApiError(error);
  }
}
