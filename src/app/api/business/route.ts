import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { businessSchema, businessQuerySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = businessQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { q, industry, city, verified, familyOwned, featured, cursor, limit } = parsed.data;

    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (industry) where.industry = industry;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (verified !== undefined) where.isVerified = verified === "true";
    if (familyOwned !== undefined) where.isFamilyOwned = familyOwned === "true";
    if (featured !== undefined) where.isFeatured = featured === "true";

    const businesses = await prisma.business.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        _count: { select: { jobPostings: true, reviews: true } },
        reviews: { select: { rating: true } },
      },
    });

    const hasMore = businesses.length > limit;
    const items = hasMore ? businesses.slice(0, limit) : businesses;

    const result = items.map((b) => {
      const ratings = b.reviews.map((r) => r.rating);
      return {
        ...b,
        rating: ratings.length ? ratings.reduce((a, c) => a + c, 0) / ratings.length : 0,
        reviewCount: b._count.reviews,
        jobCount: b._count.jobPostings,
        reviews: undefined,
        _count: undefined,
      };
    });

    return apiSuccess({
      items: result,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = businessSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;

    const existing = await prisma.business.findFirst({ where: { userId: user.id } });
    if (existing) {
      return apiError(400, "Aap ke paas pehle se aik business hai. Edit karein ya purana delete karein.");
    }

    const business = await prisma.business.create({
      data: {
        userId: user.id,
        name: sanitizeInput(d.name),
        description: d.description,
        industry: d.industry,
        category: d.category,
        logo: d.logo,
        coverImage: d.coverImage,
        website: d.website,
        phone: d.phone,
        email: d.email || null,
        address: d.address,
        city: d.city,
        province: d.province,
        latitude: d.latitude,
        longitude: d.longitude,
        socialLinks: d.socialLinks ?? undefined,
        isFamilyOwned: d.isFamilyOwned,
      },
    });

    return apiSuccess(business, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
