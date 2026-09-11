import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminRishtaActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const gender = searchParams.get("gender") || "";
    const city = searchParams.get("city") || "";
    const sect = searchParams.get("sect") || "";
    const verified = searchParams.get("verified") || "";

    const where: any = {};
    if (gender) where.user = { gender: gender.toUpperCase() };
    if (city) where.cityPreference = { contains: city, mode: "insensitive" };
    if (sect) where.sect = sect;
    if (verified) where.isVerified = verified === "true";

    const profiles = await prisma.rishtaProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, gender: true, city: true } },
      },
    });

    return apiSuccess({ profiles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...rest } = body as { id: string; [key: string]: unknown };
    if (!id) return apiError(400, "Profile id zaroori hai");

    const parsed = adminRishtaActionSchema.safeParse({ action: rest.action });
    if (!parsed.success) return apiError(400, "Ghalat action");

    const profile = await prisma.rishtaProfile.findUnique({ where: { id } });
    if (!profile) throw new Error("NOT_FOUND");

    switch (parsed.data.action) {
      case "verify":
        await prisma.rishtaProfile.update({ where: { id }, data: { isVerified: true } });
        break;
      case "unverify":
        await prisma.rishtaProfile.update({ where: { id }, data: { isVerified: false } });
        break;
      case "suspend":
        await prisma.rishtaProfile.update({ where: { id }, data: { isActive: false } });
        break;
      case "activate":
        await prisma.rishtaProfile.update({ where: { id }, data: { isActive: true } });
        break;
      case "delete":
        await prisma.rishtaProfile.delete({ where: { id } });
        break;
    }

    await auditLog(admin.id, `ADMIN_${parsed.data.action.toUpperCase()}_RISHTA`, "RishtaProfile", id, {}, getIp(req.headers));
    return apiSuccess({ message: "Action kamyab raha" });
  } catch (error) {
    return handleApiError(error);
  }
}
