import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jobPostingSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            _count: { select: { reviews: true } },
            reviews: { select: { rating: true } },
          },
        },
        applications: {
          where: { applicantId: user.id },
          select: { status: true, createdAt: true },
          take: 1,
        },
      },
    });

    if (!job) throw new Error("NOT_FOUND");

    const ratings = job.business.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // Related jobs
    const related = await prisma.jobPosting.findMany({
      where: {
        isActive: true,
        id: { not: id },
        OR: [{ businessId: job.businessId }, { type: job.type }],
      },
      include: {
        business: { select: { id: true, name: true, logo: true, city: true } },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
      ...job,
      myApplication: job.applications[0] ? { status: job.applications[0].status, appliedAt: job.applications[0].createdAt } : null,
      applications: undefined,
      business: {
        ...job.business,
        avgRating,
        reviewCount: job.business._count.reviews,
        reviews: undefined,
        _count: undefined,
      },
      relatedJobs: related,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const job = await prisma.jobPosting.findUnique({ where: { id }, include: { business: true } });
    if (!job) throw new Error("NOT_FOUND");
    if (job.business.userId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    const body = await req.json();
    const parsed = jobPostingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const data: any = {};
    const d = parsed.data;
    if (d.title !== undefined) data.title = sanitizeInput(d.title);
    if (d.description !== undefined) data.description = d.description;
    if (d.requirements !== undefined) data.requirements = d.requirements;
    if (d.type !== undefined) data.type = d.type;
    if (d.experience !== undefined) data.experience = d.experience;
    if (d.salaryMin !== undefined) data.salaryMin = d.salaryMin;
    if (d.salaryMax !== undefined) data.salaryMax = d.salaryMax;
    if (d.currency !== undefined) data.currency = d.currency;
    if (d.location !== undefined) data.location = d.location;
    if (d.isRemote !== undefined) data.isRemote = d.isRemote;
    if (d.deadline !== undefined) data.deadline = d.deadline ? new Date(d.deadline) : null;

    const updated = await prisma.jobPosting.update({ where: { id }, data });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const job = await prisma.jobPosting.findUnique({ where: { id }, include: { business: true } });
    if (!job) throw new Error("NOT_FOUND");
    if (job.business.userId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    await prisma.jobPosting.delete({ where: { id } });
    return apiSuccess({ message: "جاب ڈیلیٹ ہو گئی" });
  } catch (error) {
    return handleApiError(error);
  }
}
