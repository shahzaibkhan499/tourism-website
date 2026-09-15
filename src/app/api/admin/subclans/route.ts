// ============================================================
// POST /api/admin/subclans — ADMIN-ONLY sub-clan creation.
// ============================================================
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { subClanSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, getIp, auditLog } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
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
  } catch (error) {
    return handleApiError(error);
  }
}
