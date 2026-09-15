// ============================================================
// POST /api/community/[clanId]/join — ANY authenticated user can
// submit a join request for a clan (queue in SiteSettings, admins
// approve from the admin panel). Creation remains admin-only.
// ============================================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

type RouteCtx = { params: { clanId: string } };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const { clanId } = params;
    const body = await req.json().catch(() => ({}));
    const subClanId: string | null = typeof body.subClanId === "string" && body.subClanId ? body.subClanId : null;
    const subClanName: string | null = typeof body.subClanName === "string" && body.subClanName ? body.subClanName : null;

    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) return apiError(404, "کلان نہیں ملا");

    if (user.clanId === clanId) {
      return apiError(400, "آپ پہلے سے اس کلان کے ممبر ہیں");
    }

    // Join requests live in the SiteSettings queue (schema has no dedicated table)
    const queueSetting = await prisma.siteSettings.findUnique({ where: { key: "clan_join_requests" } });
    const queue: {
      id: string; userId: string; userName: string | null; clanId: string; clanName: string;
      subClanId: string | null; subClanName: string | null; status: string; createdAt: string;
    }[] = queueSetting ? JSON.parse(queueSetting.value || "[]") : [];

    const existing = queue.find(
      (r) => r.userId === user.id && r.clanId === clanId && r.status === "PENDING"
    );
    if (existing) {
      return apiError(400, "آپ کی درخواست پہلے سے زیر التوا ہے");
    }

    queue.push({
      id: `req-${Date.now()}`,
      userId: user.id,
      userName: (await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }))?.name ?? null,
      clanId,
      clanName: clan.name,
      subClanId,
      subClanName,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    await prisma.siteSettings.upsert({
      where: { key: "clan_join_requests" },
      update: { value: JSON.stringify(queue) },
      create: { key: "clan_join_requests", value: JSON.stringify(queue) },
    });

    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "MODERATOR"] } }, select: { id: true } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "clan_update",
          title: "Nayi clan join request",
          message: `${user.name || "ایک صارف"} ne ${clan.name} کلان جوائن کرنے کی درخواست بھیجی ہے`,
          link: "/admin/clans",
        },
      });
    }

    return apiSuccess({ queued: true, message: "جوائن کی درخواست بھیج دی گئی ہے" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
