import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const messages = await prisma.contactMessage.findMany({
      where: unreadOnly ? { isRead: false } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return apiSuccess({ messages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, isRead } = body as { id: string; isRead: boolean };
    if (!id) return apiError(400, "پیغام آئی ڈی ضروری ہے");

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });

    return apiSuccess(message);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError(400, "پیغام آئی ڈی ضروری ہے");

    await prisma.contactMessage.delete({ where: { id } });
    return apiSuccess({ message: "پیغام ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
