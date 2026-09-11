import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rishtaRequestSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const myProfile = await prisma.rishtaProfile.findUnique({ where: { userId: user.id } });
    if (!myProfile) {
      return apiSuccess({ sent: [], received: [] });
    }

    const [sent, received] = await Promise.all([
      prisma.rishtaRequest.findMany({
        where: { senderId: myProfile.id },
        include: {
          receiver: {
            include: {
              user: { select: { id: true, name: true, image: true, gender: true, city: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.rishtaRequest.findMany({
        where: { receiverId: myProfile.id },
        include: {
          sender: {
            include: {
              user: { select: { id: true, name: true, image: true, gender: true, city: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return apiSuccess({ sent, received });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = rishtaRequestSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { receiverId, message } = parsed.data;

    const myProfile = await prisma.rishtaProfile.findUnique({ where: { userId: user.id } });
    if (!myProfile) {
      return apiError(400, "Pehle apna rishta profile banayein");
    }

    const receiver = await prisma.rishtaProfile.findUnique({ where: { id: receiverId } });
    if (!receiver || !receiver.isActive) throw new Error("NOT_FOUND");
    if (receiver.userId === user.id) return apiError(400, "Apne aap ko request nahi bhej sakte");

    const existing = await prisma.rishtaRequest.findFirst({
      where: { senderId: myProfile.id, receiverId },
    });
    if (existing) {
      return apiError(400, "Aap pehle se request bhej chuke hain");
    }

    const request = await prisma.rishtaRequest.create({
      data: {
        senderId: myProfile.id,
        receiverId,
        message: message ? sanitizeInput(message) : null,
      },
    });

    // Notify receiver
    await prisma.notification.create({
      data: {
        userId: receiver.userId,
        type: "rishta_request",
        title: "Nayi rishta request!",
        message: `${user.name || "Kisi"} ne aapko rishta request bheji hai`,
        link: `/rishta/${receiver.id}`,
      },
    });

    return apiSuccess(request, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = z
      .object({
        requestId: z.string().min(1, "Request id chahiye"),
        action: z.enum(["ACCEPTED", "REJECTED"]),
      })
      .safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { requestId, action } = parsed.data;

    const myProfile = await prisma.rishtaProfile.findUnique({ where: { userId: user.id } });
    if (!myProfile) {
      return apiError(400, "Pehle apna rishta profile banayein");
    }

    const request = await prisma.rishtaRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true },
    });
    if (!request) throw new Error("NOT_FOUND");
    if (request.receiverId !== myProfile.id) throw new Error("FORBIDDEN");
    if (request.status !== "PENDING") {
      return apiError(400, "Is request par pehle se action liya ja chuka hai");
    }

    const updated = await prisma.rishtaRequest.update({
      where: { id: requestId },
      data: { status: action },
    });

    await prisma.notification.create({
      data: {
        userId: request.sender.userId,
        type: "rishta_response",
        title: action === "ACCEPTED" ? "Rishta request qabool ho gayi! 🎉" : "Rishta request par jawab",
        message:
          action === "ACCEPTED"
            ? `${user.name || "Kisi"} ne aapki rishta request qabool kar li hai`
            : `${user.name || "Kisi"} ne aapki rishta request maazrat ke saath reject kar di hai`,
        link: `/rishta/${request.senderId}`,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
