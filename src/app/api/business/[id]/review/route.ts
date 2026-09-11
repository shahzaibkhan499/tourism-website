import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { businessReviewSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business || !business.isActive) throw new Error("NOT_FOUND");

    const body = await req.json();
    const parsed = businessReviewSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { rating, comment } = parsed.data;

    const existing = await prisma.businessReview.findFirst({
      where: { businessId: id, userId: user.id },
    });

    if (existing) {
      const updated = await prisma.businessReview.update({
        where: { id: existing.id },
        data: { rating, comment: comment ? sanitizeInput(comment) : null },
      });
      return apiSuccess(updated);
    }

    const review = await prisma.businessReview.create({
      data: {
        businessId: id,
        userId: user.id,
        rating,
        comment: comment ? sanitizeInput(comment) : null,
      },
    });

    return apiSuccess(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
