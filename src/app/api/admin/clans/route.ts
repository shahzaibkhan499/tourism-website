import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communitySchema, clanSchema, subClanSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "communities";

    if (tab === "join-requests") {
      const setting = await prisma.siteSettings.findUnique({ where: { key: "clan_join_requests" } });
      const queue = setting ? JSON.parse(setting.value || "[]") : [];
      return apiSuccess({ requests: queue });
    }

    if (tab === "subclans") {
      const subClans = await prisma.subClan.findMany({
        include: {
          clan: { select: { id: true, name: true } },
          _count: { select: { members: true } },
        },
        orderBy: { name: "asc" },
      });
      return apiSuccess({ subClans });
    }

    const communities = await prisma.community.findMany({
      include: {
        clans: {
          include: {
            subClans: { include: { _count: { select: { members: true } } } },
            _count: { select: { members: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess({
      communities: communities.map((c) => ({
        ...c,
        clansCount: c.clans.length,
        membersCount: c.clans.reduce((sum, cl) => sum + cl._count.members, 0),
        clans: c.clans.map((cl) => ({
          ...cl,
          subClansCount: cl.subClans.length,
          membersCount: cl._count.members,
          subClans: undefined,
          _count: undefined,
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { entity } = body as { entity: "community" | "clan" | "subclan" };

    if (entity === "community") {
      const parsed = communitySchema.safeParse(body);
      if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
      const item = await prisma.community.create({
        data: {
          name: sanitizeInput(parsed.data.name),
          nameUrdu: parsed.data.nameUrdu,
          description: parsed.data.description,
          region: parsed.data.region,
          logo: parsed.data.logo,
        },
      });
      await auditLog(admin.id, "ADMIN_CREATE_COMMUNITY", "Community", item.id, { name: item.name }, getIp(req.headers));
      return apiSuccess(item, 201);
    }

    if (entity === "clan") {
      const parsed = clanSchema.safeParse(body);
      if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
      const item = await prisma.clan.create({
        data: {
          name: sanitizeInput(parsed.data.name),
          nameUrdu: parsed.data.nameUrdu,
          description: parsed.data.description,
          history: parsed.data.history,
          communityId: parsed.data.communityId,
          logo: parsed.data.logo,
        },
      });
      await auditLog(admin.id, "ADMIN_CREATE_CLAN", "Clan", item.id, { name: item.name }, getIp(req.headers));
      return apiSuccess(item, 201);
    }

    if (entity === "subclan") {
      const parsed = subClanSchema.safeParse(body);
      if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
      const item = await prisma.subClan.create({
        data: {
          name: sanitizeInput(parsed.data.name),
          nameUrdu: parsed.data.nameUrdu,
          description: parsed.data.description,
          clanId: parsed.data.clanId,
        },
      });
      await auditLog(admin.id, "ADMIN_CREATE_SUBCLAN", "SubClan", item.id, { name: item.name }, getIp(req.headers));
      return apiSuccess(item, 201);
    }

    return apiError(400, "Ghalat entity");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { entity, id, ...rest } = body as { entity: "community" | "clan" | "subclan"; id: string; [key: string]: unknown };

    if (entity === "community") {
      const updated = await prisma.community.update({
        where: { id },
        data: {
          name: rest.name ? sanitizeInput(String(rest.name)) : undefined,
          nameUrdu: rest.nameUrdu !== undefined ? (rest.nameUrdu as string) : undefined,
          description: rest.description !== undefined ? (rest.description as string) : undefined,
          region: rest.region !== undefined ? (rest.region as string) : undefined,
          isActive: rest.isActive !== undefined ? Boolean(rest.isActive) : undefined,
        },
      });
      await auditLog(admin.id, "ADMIN_UPDATE_COMMUNITY", "Community", id, {}, getIp(req.headers));
      return apiSuccess(updated);
    }

    if (entity === "clan") {
      const updated = await prisma.clan.update({
        where: { id },
        data: {
          name: rest.name ? sanitizeInput(String(rest.name)) : undefined,
          nameUrdu: rest.nameUrdu !== undefined ? (rest.nameUrdu as string) : undefined,
          description: rest.description !== undefined ? (rest.description as string) : undefined,
          history: rest.history !== undefined ? (rest.history as string) : undefined,
          isActive: rest.isActive !== undefined ? Boolean(rest.isActive) : undefined,
        },
      });
      await auditLog(admin.id, "ADMIN_UPDATE_CLAN", "Clan", id, {}, getIp(req.headers));
      return apiSuccess(updated);
    }

    if (entity === "subclan") {
      const updated = await prisma.subClan.update({
        where: { id },
        data: {
          name: rest.name ? sanitizeInput(String(rest.name)) : undefined,
          nameUrdu: rest.nameUrdu !== undefined ? (rest.nameUrdu as string) : undefined,
          description: rest.description !== undefined ? (rest.description as string) : undefined,
          isActive: rest.isActive !== undefined ? Boolean(rest.isActive) : undefined,
        },
      });
      await auditLog(admin.id, "ADMIN_UPDATE_SUBCLAN", "SubClan", id, {}, getIp(req.headers));
      return apiSuccess(updated);
    }

    return apiError(400, "Ghalat entity");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const id = searchParams.get("id");
    if (!entity || !id) return apiError(400, "Entity aur id zaroori hain");

    if (entity === "community") {
      const count = await prisma.clan.count({ where: { communityId: id } });
      if (count > 0) return apiError(400, "Is community mein clans mojood hain, pehle unhein delete karein");
      await prisma.community.delete({ where: { id } });
    } else if (entity === "clan") {
      const count = await prisma.subClan.count({ where: { clanId: id } });
      if (count > 0) return apiError(400, "Is clan mein sub-clans mojood hain, pehle unhein delete karein");
      await prisma.clan.delete({ where: { id } });
    } else if (entity === "subclan") {
      await prisma.subClan.delete({ where: { id } });
    } else {
      return apiError(400, "Ghalat entity");
    }

    await auditLog(admin.id, `ADMIN_DELETE_${entity.toUpperCase()}`, entity, id, {}, getIp(req.headers));
    return apiSuccess({ message: "Delete ho gaya" });
  } catch (error) {
    return handleApiError(error);
  }
}
