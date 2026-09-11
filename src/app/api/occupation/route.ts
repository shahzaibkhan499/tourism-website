import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { occupationStatusSchema, occupationSectionSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET: occupation profile of the current user
export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.occupationProfile.findUnique({ where: { userId: user.id } });
    return apiSuccess(profile ?? { employmentStatus: "EMPLOYED", jobType: "FULL_TIME", details: {} });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: upsert employment status / job type (and optional full details)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = occupationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const profile = await prisma.occupationProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(parsed.data.employmentStatus ? { employmentStatus: parsed.data.employmentStatus } : {}),
        ...(parsed.data.jobType ? { jobType: parsed.data.jobType } : {}),
      },
      create: {
        userId: user.id,
        employmentStatus: parsed.data.employmentStatus ?? "EMPLOYED",
        jobType: parsed.data.jobType ?? "FULL_TIME",
        details: {},
      },
    });

    return apiSuccess(profile, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: save one occupation category section (merged into details Json)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = occupationSectionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { category, data } = parsed.data;
    const current = await prisma.occupationProfile.findUnique({ where: { userId: user.id } });
    const details = (current?.details ?? {}) as Record<string, unknown>;

    const profile = await prisma.occupationProfile.upsert({
      where: { userId: user.id },
      update: { details: { ...details, [category]: data } as Prisma.InputJsonValue },
      create: {
        userId: user.id,
        employmentStatus: "EMPLOYED",
        jobType: "FULL_TIME",
        details: { [category]: data } as Prisma.InputJsonValue,
      },
    });

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
