import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminReportActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reported: { select: { id: true, name: true, email: true, isBanned: true } },
      },
    });

    return apiSuccess({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...rest } = body as { id: string; [key: string]: unknown };
    if (!id) return apiError(400, "رپورٹ آئی ڈی ضروری ہے");

    const parsed = adminReportActionSchema.safeParse({ action: rest.action, adminNote: rest.adminNote });
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) throw new Error("NOT_FOUND");

    const { action, adminNote } = parsed.data;

    switch (action) {
      case "reviewed":
        await prisma.report.update({ where: { id }, data: { status: "REVIEWED" } });
        break;
      case "resolve":
        await prisma.report.update({
          where: { id },
          data: { status: "RESOLVED", adminNote, resolvedAt: new Date() },
        });
        await prisma.notification.create({
          data: {
            userId: report.reporterId,
            type: "system",
            title: "Report resolve ho gayi",
            message: `Aapki report ka review ho gaya hai. ${adminNote || ""}`.trim(),
          },
        });
        break;
      case "dismiss":
        await prisma.report.update({ where: { id }, data: { status: "DISMISSED", adminNote, resolvedAt: new Date() } });
        break;
      case "warn":
        await prisma.report.update({ where: { id }, data: { status: "RESOLVED", adminNote, resolvedAt: new Date() } });
        await prisma.notification.create({
          data: {
            userId: report.reportedId,
            type: "system",
            title: "Warning!",
            message: `Aapke khilaf report aayi hai. ${adminNote || "بار بار ایسی شکایت پر اکاؤنٹ بند ہو سکتا ہے۔"}`.trim(),
          },
        });
        break;
      case "ban":
        await prisma.user.update({
          where: { id: report.reportedId },
          data: { isBanned: true, isActive: false, banReason: adminNote || "Reported violation" },
        });
        await prisma.report.update({ where: { id }, data: { status: "RESOLVED", adminNote, resolvedAt: new Date() } });
        break;
    }

    await auditLog(admin.id, `ADMIN_${action.toUpperCase()}_REPORT`, "Report", id, { adminNote }, getIp(req.headers));
    return apiSuccess({ message: "کارروائی کامیاب رہی" });
  } catch (error) {
    return handleApiError(error);
  }
}
