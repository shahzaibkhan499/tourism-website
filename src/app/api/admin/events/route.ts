import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminEventActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const q = searchParams.get("q") || "";

    const where: any = {};
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { rsvps: true } },
      },
    });

    return apiSuccess({ events });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...rest } = body as { id: string; [key: string]: unknown };
    if (!id) return apiError(400, "Event id zaroori hai");

    const parsed = adminEventActionSchema.safeParse({ action: rest.action });
    if (!parsed.success) return apiError(400, "Ghalat action");

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new Error("NOT_FOUND");

    switch (parsed.data.action) {
      case "feature":
        await prisma.event.update({ where: { id }, data: { isPublic: true } });
        break;
      case "unfeature":
        await prisma.event.update({ where: { id }, data: { isPublic: false } });
        break;
      case "delete":
        await prisma.event.delete({ where: { id } });
        break;
    }

    await auditLog(admin.id, `ADMIN_${parsed.data.action.toUpperCase()}_EVENT`, "Event", id, { title: event.title }, getIp(req.headers));
    return apiSuccess({ message: "Action kamyab raha" });
  } catch (error) {
    return handleApiError(error);
  }
}
