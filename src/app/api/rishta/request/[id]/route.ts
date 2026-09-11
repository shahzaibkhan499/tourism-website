import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rishtaRequestActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const body = await req.json();
    const parsed = rishtaRequestActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const request = await prisma.rishtaRequest.findUnique({
      where: { id },
      include: {
        receiver: true,
        sender: { include: { user: { select: { name: true } } } },
      },
    });

    if (!request) throw new Error("NOT_FOUND");
    if (request.receiver.userId !== user.id) throw new Error("FORBIDDEN");

    const { status } = parsed.data;
    const updated = await prisma.rishtaRequest.update({
      where: { id },
      data: { status },
    });

    if (status === "ACCEPTED") {
      await prisma.notification.create({
        data: {
          userId: request.sender.userId,
          type: "rishta_accepted",
          title: "Rishta request accept!",
          message: "Aapki rishta request accept kar li gayi hai",
          link: "/rishta",
        },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
