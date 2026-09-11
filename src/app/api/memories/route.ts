import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { memorySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const visibility = searchParams.get("visibility");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 50);

    const where: any = { userId: user.id };
    if (category) where.category = category;
    if (visibility === "public") where.isPublic = true;
    if (visibility === "private") where.isPublic = false;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to);
    }

    const memories = await prisma.memory.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { media: { orderBy: { createdAt: "asc" } } },
    });

    const hasMore = memories.length > limit;
    const items = hasMore ? memories.slice(0, limit) : memories;

    // "On This Day" memories
    const today = new Date();
    const onThisDay = await prisma.memory.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, date: true },
    });
    const onThisDayItems = onThisDay.filter((m) => {
      if (!m.date) return false;
      const d = new Date(m.date);
      return d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() !== today.getFullYear();
    });

    return apiSuccess({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
      onThisDay: onThisDayItems,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = memorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;

    const memory = await prisma.memory.create({
      data: {
        title: sanitizeInput(d.title),
        description: d.description,
        date: d.date ? new Date(d.date) : null,
        location: d.location ? sanitizeInput(d.location) : null,
        category: d.category as never,
        isPublic: d.isPublic,
        userId: user.id,
        media: {
          create: d.media.map((m) => ({
            url: m.url,
            publicId: m.publicId,
            type: m.type,
            size: m.size,
            mimeType: m.mimeType,
            userId: user.id,
          })),
        },
      },
      include: { media: true },
    });

    return apiSuccess(memory, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
