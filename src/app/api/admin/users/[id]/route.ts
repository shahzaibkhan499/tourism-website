import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminUserActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        clan: { select: { id: true, name: true } },
        subClan: { select: { id: true, name: true } },
        rishtaProfile: true,
        jobProfile: true,
        businesses: { select: { id: true, name: true } },
        _count: {
          select: {
            events: true,
            memories: true,
            media: true,
            reports: true,
            reportedBy: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) throw new Error("NOT_FOUND");

    return apiSuccess({
      ...user,
      password: undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const { id } = params;

    const body = await req.json();
    const parsed = adminUserActionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new Error("NOT_FOUND");
    if (target.id === admin.id && parsed.data.action === "ban") {
      return apiError(400, "آپ خود کو بند نہیں کر سکتے");
    }

    const { action, role, reason } = parsed.data;

    switch (action) {
      case "verify":
        await prisma.user.update({ where: { id }, data: { isVerified: true } });
        break;
      case "unverify":
        await prisma.user.update({ where: { id }, data: { isVerified: false } });
        break;
      case "role":
        if (!role) return apiError(400, "کردار منتخب کریں");
        await prisma.user.update({ where: { id }, data: { role } });
        break;
      case "ban":
        await prisma.user.update({
          where: { id },
          data: { isBanned: true, banReason: reason || "Violation of community guidelines", isActive: false },
        });
        await prisma.notification.create({
          data: {
            userId: id,
            type: "system",
            title: "Account ban",
            message: `آپ کا اکاؤنٹ بند کر دیا گیا ہے. Wajah: ${reason || "community guidelines ki khilaf warzi"}`,
          },
        });
        break;
      case "unban":
        await prisma.user.update({
          where: { id },
          data: { isBanned: false, banReason: null, isActive: true },
        });
        break;
      case "delete":
        await prisma.user.delete({ where: { id } });
        break;
      default:
        return apiError(400, "غلط کارروائی");
    }

    await auditLog(admin.id, `ADMIN_${action.toUpperCase()}_USER`, "User", id, { email: target.email, reason }, getIp(req.headers));

    return apiSuccess({ message: `User par action "${action}" kamyab raha` });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const { id } = params;
    if (id === admin.id) return apiError(400, "آپ خود کو ڈیلیٹ نہیں کر سکتے");

    await prisma.user.delete({ where: { id } });
    await auditLog(admin.id, "ADMIN_DELETE_USER", "User", id, {}, getIp(req.headers));
    return apiSuccess({ message: "صارف ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
