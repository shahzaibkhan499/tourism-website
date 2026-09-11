import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireAdmin, auditLog, getIp } from "@/lib/api";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (type) where.type = type;

    const [media, totalSize, typeCounts] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.media.aggregate({ _sum: { size: true } }),
      prisma.media.groupBy({ by: ["type"], _count: true }),
    ]);

    return apiSuccess({
      media,
      totalSize: totalSize._sum.size || 0,
      typeCounts: Object.fromEntries(typeCounts.map((t) => [t.type, t._count])),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");
    if (!ids) return apiError(400, "میڈیا آئی ڈیز ضروری ہیں");

    const idList = ids.split(",");
    const items = await prisma.media.findMany({ where: { id: { in: idList } } });
    if (items.length === 0) throw new Error("NOT_FOUND");

    for (const item of items) {
      if (item.publicId) await deleteFromCloudinary(item.publicId);
    }

    await prisma.media.deleteMany({ where: { id: { in: idList } } });
    await auditLog(admin.id, "ADMIN_DELETE_MEDIA", "Media", idList.join(","), { count: items.length }, getIp(req.headers));

    return apiSuccess({ message: `${items.length} میڈیا فائلیں ڈیلیٹ ہو گئیں` });
  } catch (error) {
    return handleApiError(error);
  }
}
