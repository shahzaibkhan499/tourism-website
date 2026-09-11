import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { reportSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { reportedId, type, reason } = parsed.data;

    if (reportedId === user.id) {
      return apiError(400, "Apne aap ko report nahi kar sakte");
    }

    const reported = await prisma.user.findUnique({ where: { id: reportedId } });
    if (!reported) throw new Error("NOT_FOUND");

    const existing = await prisma.report.findFirst({
      where: {
        reporterId: user.id,
        reportedId,
        status: { in: ["PENDING", "REVIEWED"] },
      },
    });
    if (existing) {
      return apiError(400, "Aap is user ko pehle se report kar chuke hain");
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedId,
        type,
        reason: sanitizeInput(reason),
      },
    });

    return apiSuccess({ message: "Report submit ho gayi. Hamari team review karegi.", report }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
