import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { businessSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        reviews: { orderBy: { createdAt: "desc" } },
        jobPostings: {
          where: { isActive: true },
          include: { _count: { select: { applications: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { jobPostings: true } },
      },
    });

    if (!business || !business.isActive) throw new Error("NOT_FOUND");

    // BusinessReview has no relation to User (schema is fixed), so fetch reviewers separately
    const reviewerIds = Array.from(new Set(business.reviews.map((r) => r.userId)));
    const reviewers = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, image: true },
    });
    const reviewerMap = new Map(reviewers.map((u) => [u.id, u]));

    const reviewsWithUser = business.reviews.map((r) => ({
      ...r,
      user: reviewerMap.get(r.userId) ?? null,
    }));

    const ratings = business.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    return apiSuccess({
      ...business,
      reviews: reviewsWithUser,
      avgRating,
      isOwner: business.userId === user.id,
      myReview: reviewsWithUser.find((r) => r.userId === user.id) ?? null,
      jobs: business.jobPostings.map((j) => ({ ...j, applicationsCount: j._count.applications, _count: undefined })),
      jobPostings: undefined,
      _count: undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) throw new Error("NOT_FOUND");
    if (business.userId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    const body = await req.json();
    const parsed = businessSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;
    const data: any = {};
    if (d.name !== undefined) data.name = sanitizeInput(d.name);
    if (d.description !== undefined) data.description = d.description;
    if (d.industry !== undefined) data.industry = d.industry;
    if (d.category !== undefined) data.category = d.category;
    if (d.logo !== undefined) data.logo = d.logo;
    if (d.coverImage !== undefined) data.coverImage = d.coverImage;
    if (d.website !== undefined) data.website = d.website;
    if (d.phone !== undefined) data.phone = d.phone;
    if (d.email !== undefined) data.email = d.email;
    if (d.address !== undefined) data.address = d.address;
    if (d.city !== undefined) data.city = d.city;
    if (d.province !== undefined) data.province = d.province;
    if (d.socialLinks !== undefined) data.socialLinks = d.socialLinks;
    if (d.isFamilyOwned !== undefined) data.isFamilyOwned = d.isFamilyOwned;

    const updated = await prisma.business.update({ where: { id }, data });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) throw new Error("NOT_FOUND");
    if (business.userId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    await prisma.business.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess({ message: "Business deactivate ho gaya" });
  } catch (error) {
    return handleApiError(error);
  }
}
