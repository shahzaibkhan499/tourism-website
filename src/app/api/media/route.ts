import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mediaQuerySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = mediaQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { type, q, cursor, limit } = parsed.data;

    const where: any = { userId: user.id };
    if (type && type !== "ALL") where.type = type;
    if (q) {
      where.OR = [{ url: { contains: q, mode: "insensitive" } }];
    }

    const [media, totalSize, typeCounts] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      prisma.media.aggregate({ where: { userId: user.id }, _sum: { size: true } }),
      prisma.media.groupBy({ by: ["type"], where: { userId: user.id }, _count: true }),
    ]);

    const hasMore = media.length > limit;
    const items = hasMore ? media.slice(0, limit) : media;

    return apiSuccess({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
      totalSize: totalSize._sum.size || 0,
      quotaGb: 5,
      typeCounts: Object.fromEntries(typeCounts.map((t) => [t.type, t._count])),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");
    if (!ids) return apiError(400, "Media ids zaroori hain");

    const idList = ids.split(",");

    const mediaItems = await prisma.media.findMany({
      where: { id: { in: idList }, userId: user.id },
    });
    if (mediaItems.length === 0) throw new Error("NOT_FOUND");

    // Delete from Cloudinary (best effort)
    for (const item of mediaItems) {
      if (item.publicId) await deleteFromCloudinary(item.publicId);
    }

    await prisma.media.deleteMany({
      where: { id: { in: mediaItems.map((m) => m.id) } },
    });

    return apiSuccess({ message: `${mediaItems.length} file(s) delete ho gayi` });
  } catch (error) {
    return handleApiError(error);
  }
}
