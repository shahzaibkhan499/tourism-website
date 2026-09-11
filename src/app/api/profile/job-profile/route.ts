import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jobProfileSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.jobProfile.findUnique({ where: { userId: user.id } });
    return apiSuccess({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = jobProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;

    const profile = await prisma.jobProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: d.headline,
        summary: d.summary,
        experience: d.experience as never,
        education: d.education as never,
        skills: d.skills,
        languages: d.languages,
        resumeUrl: d.resumeUrl,
        linkedinUrl: d.linkedinUrl,
        githubUrl: d.githubUrl,
        portfolioUrl: d.portfolioUrl,
        expectedSalary: d.expectedSalary,
        preferredLocations: d.preferredLocations,
        availability: d.availability,
      },
      create: {
        userId: user.id,
        headline: d.headline,
        summary: d.summary,
        experience: d.experience as never,
        education: d.education as never,
        skills: d.skills,
        languages: d.languages,
        resumeUrl: d.resumeUrl,
        linkedinUrl: d.linkedinUrl,
        githubUrl: d.githubUrl,
        portfolioUrl: d.portfolioUrl,
        expectedSalary: d.expectedSalary,
        preferredLocations: d.preferredLocations,
        availability: d.availability,
      },
    });

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
