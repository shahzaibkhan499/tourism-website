// ============================================================
// POST /api/admin/communities — ADMIN-ONLY community creation.
// Regular users have NO community creation route at all.
// ============================================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communitySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, getIp, auditLog } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
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
  } catch (error) {
    return handleApiError(error);
  }
}
