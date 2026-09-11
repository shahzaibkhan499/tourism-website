import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jobPostingSchema, jobQuerySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = jobQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { q, type, location, experience, industry, minSalary, remote, cursor, limit } = parsed.data;

    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { business: { name: { contains: q, mode: "insensitive" } } },
      ];
    }
    if (type) where.type = type;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (experience) where.experience = { contains: experience, mode: "insensitive" };
    if (industry) where.business = { industry };
    if (minSalary !== undefined) where.salaryMax = { gte: minSalary };
    if (remote !== undefined) where.isRemote = remote === "true";

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
            industry: true,
            isVerified: true,
            isFamilyOwned: true,
          },
        },
        _count: { select: { applications: true } },
        applications: {
          where: { applicantId: user.id },
          select: { status: true },
          take: 1,
        },
      },
    });

    const hasMore = jobs.length > limit;
    const items = hasMore ? jobs.slice(0, limit) : jobs;

    const result = items.map((j) => ({
      ...j,
      applicationsCount: j._count.applications,
      myApplication: j.applications[0] ? { status: j.applications[0].status } : null,
      _count: undefined,
      applications: undefined,
    }));

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
    const parsed = jobPostingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const business = await prisma.business.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!business) {
      return apiError(400, "نوکری پوسٹ کرنے کے لیے پہلے بزنس پروفائل بنائیں");
    }

    const d = parsed.data;
    const job = await prisma.jobPosting.create({
      data: {
        businessId: business.id,
        title: sanitizeInput(d.title),
        description: d.description,
        requirements: d.requirements,
        type: d.type as never,
        experience: d.experience,
        salaryMin: d.salaryMin,
        salaryMax: d.salaryMax,
        currency: d.currency,
        location: d.location ? sanitizeInput(d.location) : null,
        isRemote: d.isRemote,
        deadline: d.deadline ? new Date(d.deadline) : null,
      },
    });

    return apiSuccess(job, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
