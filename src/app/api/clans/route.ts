import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { joinClanSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser, requireModeratorOrAdmin } from "@/lib/api";

// GET /api/clans — communities list with their clans (user-scoped view)
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { nameUrdu: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const communities = await prisma.community.findMany({
      where: { ...where, isActive: true },
      include: {
        clans: {
          where: { isActive: true },
          include: {
            _count: { select: { members: true, subClans: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const myClan = user ? await prisma.clan.findUnique({
      where: { id: user.clanId || "" },
      include: { _count: { select: { members: true, subClans: true } }, community: true },
    }) : null;

    return apiSuccess({
      communities,
      myClan,
      myClanId: user.clanId,
      mySubClanId: user.subClanId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/clans — submit a join request (queue stored in SiteSettings)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = joinClanSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { clanId, subClanId, subClanName } = parsed.data;

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new Error("NOT_FOUND");

    if (user.clanId === clanId) {
      return apiError(400, "آپ پہلے سے اس کلان کے ممبر ہیں");
    }

    // Store join request in SiteSettings queue (schema has no dedicated table)
    const queueSetting = await prisma.siteSettings.findUnique({ where: { key: "clan_join_requests" } });
    const queue = queueSetting ? JSON.parse(queueSetting.value || "[]") : [];

    const existing = queue.find(
      (r: { userId: string; clanId: string; status: string }) =>
        r.userId === user.id && r.clanId === clanId && r.status === "PENDING"
    );
    if (existing) {
      return apiError(400, "آپ کی درخواست پہلے سے زیر التوا ہے");
    }

    queue.push({
      id: `req-${Date.now()}`,
      userId: user.id,
      userName: (await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }))?.name,
      clanId,
      clanName: clan.name,
      subClanId: subClanId || null,
      subClanName: subClanName || null,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    await prisma.siteSettings.upsert({
      where: { key: "clan_join_requests" },
      update: { value: JSON.stringify(queue) },
      create: { key: "clan_join_requests", value: JSON.stringify(queue) },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "MODERATOR"] } }, select: { id: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "clan_update",
          title: "Nayi clan join request",
          message: `${user.name || "Aik user"} ne ${clan.name} clan join karne ki request bheji hai`,
          link: "/admin/clans",
        },
      });
    }

    return apiSuccess({ message: "شمولیت کی درخواست بھیج دی گئی! منظوری کے بعد آپ ممبر بن جائیں گے۔" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/clans — moderator/admin action on join requests (approve/reject)
export async function PATCH(req: NextRequest) {
  try {
    await requireModeratorOrAdmin();
    const body = await req.json();
    const { requestId, action } = body as { requestId: string; action: "APPROVE" | "REJECT" };

    if (!requestId || !["APPROVE", "REJECT"].includes(action)) {
      return apiError(400, "غلط درخواست");
    }

    const queueSetting = await prisma.siteSettings.findUnique({ where: { key: "clan_join_requests" } });
    const queue = queueSetting ? JSON.parse(queueSetting.value || "[]") : [];

    const request = queue.find((r: { id: string }) => r.id === requestId);
    if (!request) throw new Error("NOT_FOUND");

    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { clanId: request.clanId, subClanId: request.subClanId },
      });
      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: "clan_update",
          title: "Clan request manzoor!",
          message: `${request.clanName} clan join karne ki aapki request manzoor ho gayi. خوش آمدید!`,
          link: "/community",
        },
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: "clan_update",
          title: "Clan request reject",
          message: `${request.clanName} clan join karne ki aapki request reject ho gayi.`,
          link: "/community",
        },
      });
    }

    request.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    await prisma.siteSettings.update({
      where: { key: "clan_join_requests" },
      data: { value: JSON.stringify(queue) },
    });

    return apiSuccess({ message: `Request ${action === "APPROVE" ? "approve" : "reject"} ho gayi` });
  } catch (error) {
    return handleApiError(error);
  }
}
