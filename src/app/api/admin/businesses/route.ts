import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { adminBusinessActionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const industry = searchParams.get("industry") || "";
    const city = searchParams.get("city") || "";
    const verified = searchParams.get("verified") || "";

    const where: any = {};
    if (industry) where.industry = industry;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (verified) where.isVerified = verified === "true";

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { jobPostings: true, reviews: true } },
      },
    });

    return apiSuccess({ businesses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...rest } = body as { id: string; [key: string]: unknown };
    if (!id) return apiError(400, "بزنس آئی ڈی ضروری ہے");

    const parsed = adminBusinessActionSchema.safeParse({ action: rest.action });
    if (!parsed.success) return apiError(400, "غلط کارروائی");

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) throw new Error("NOT_FOUND");

    switch (parsed.data.action) {
      case "verify":
        await prisma.business.update({ where: { id }, data: { isVerified: true } });
        break;
      case "unverify":
        await prisma.business.update({ where: { id }, data: { isVerified: false } });
        break;
      case "feature":
        await prisma.business.update({ where: { id }, data: { isFeatured: true } });
        break;
      case "unfeature":
        await prisma.business.update({ where: { id }, data: { isFeatured: false } });
        break;
      case "suspend":
        await prisma.business.update({ where: { id }, data: { isActive: false } });
        break;
      case "activate":
        await prisma.business.update({ where: { id }, data: { isActive: true } });
        break;
      case "delete":
        await prisma.business.delete({ where: { id } });
        break;
    }

    await auditLog(admin.id, `ADMIN_${parsed.data.action.toUpperCase()}_BUSINESS`, "Business", id, { name: business.name }, getIp(req.headers));
    return apiSuccess({ message: "کارروائی کامیاب رہی" });
  } catch (error) {
    return handleApiError(error);
  }
}
