import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jobApplicationSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

const applySchema = jobApplicationSchema.extend({
  jobPostingId: z.string().min(1, "Job chunein"),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const applications = await prisma.jobApplication.findMany({
      where: { applicantId: user.id },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            type: true,
            location: true,
            isActive: true,
            business: { select: { name: true, logo: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ items: applications });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { jobPostingId, coverLetter, resumeUrl } = parsed.data;

    const job = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
    if (!job || !job.isActive) throw new Error("NOT_FOUND");

    const profile = await prisma.jobProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return apiError(400, "Pehle apna job profile banayein (Profile > Job Profile)");
    }

    const existing = await prisma.jobApplication.findUnique({
      where: { jobPostingId_applicantId: { jobPostingId, applicantId: user.id } },
    });
    if (existing) {
      return apiError(400, "Aap is job ke liye pehle se apply kar chuke hain");
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobPostingId,
        applicantId: user.id,
        profileId: profile.id,
        coverLetter: coverLetter ? sanitizeInput(coverLetter) : null,
        resumeUrl: resumeUrl || profile.resumeUrl,
      },
    });

    // Notify business owner
    const business = await prisma.business.findUnique({ where: { id: job.businessId } });
    if (business) {
      await prisma.notification.create({
        data: {
          userId: business.userId,
          type: "job_application",
          title: "Nayi job application!",
          message: `${user.name || "Kisi"} ne "${job.title}" ke liye apply kiya hai`,
          link: `/jobs/${job.id}`,
        },
      });
    }

    return apiSuccess(application, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
