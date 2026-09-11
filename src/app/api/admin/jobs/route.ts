import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminJobActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";
    const isActive = searchParams.get("isActive") || "";

    const where: any = {};
    if (type) where.type = type;
    if (isActive) where.isActive = isActive === "true";

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        business: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    });

    return apiSuccess({ jobs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...rest } = body as { id: string; [key: string]: unknown };
    if (!id) return apiError(400, "Job id zaroori hai");

    const parsed = adminJobActionSchema.safeParse({ action: rest.action });
    if (!parsed.success) return apiError(400, "Ghalat action");

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) throw new Error("NOT_FOUND");

    switch (parsed.data.action) {
      case "activate":
        await prisma.jobPosting.update({ where: { id }, data: { isActive: true } });
        break;
      case "deactivate":
        await prisma.jobPosting.update({ where: { id }, data: { isActive: false } });
        break;
      case "delete":
        await prisma.jobPosting.delete({ where: { id } });
        break;
    }

    await auditLog(admin.id, `ADMIN_${parsed.data.action.toUpperCase()}_JOB`, "JobPosting", id, { title: job.title }, getIp(req.headers));
    return apiSuccess({ message: "Action kamyab raha" });
  } catch (error) {
    return handleApiError(error);
  }
}
