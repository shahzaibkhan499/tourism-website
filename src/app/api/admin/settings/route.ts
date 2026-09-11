import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminSettingsSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.siteSettings.findMany({ orderBy: { key: "asc" } });
    return apiSuccess({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = adminSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    await prisma.$transaction(
      parsed.data.settings.map((s) =>
        prisma.siteSettings.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: { key: s.key, value: s.value },
        })
      )
    );

    await auditLog(admin.id, "ADMIN_UPDATE_SETTINGS", "SiteSettings", undefined, { count: parsed.data.settings.length }, getIp(req.headers));
    return apiSuccess({ message: "Settings save ho gayin" });
  } catch (error) {
    return handleApiError(error);
  }
}
