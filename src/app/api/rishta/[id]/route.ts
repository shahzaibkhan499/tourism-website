import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rishtaProfileSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const profile = await prisma.rishtaProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            gender: true,
            city: true,
            province: true,
            isVerified: true,
            createdAt: true,
            clan: { select: { id: true, name: true, nameUrdu: true } },
          },
        },
      },
    });

    if (!profile || !profile.isActive) throw new Error("NOT_FOUND");

    const isOwner = profile.userId === user.id;
    const approved = isOwner || profile.isVerified;

    // Increment view count (not for owner)
    if (!isOwner) {
      await prisma.rishtaProfile.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      });
      profile.viewsCount += 1;
    }

    // Blur sensitive data for non-approved viewers
    const photos = approved ? profile.photos : [];

    return apiSuccess({
      ...profile,
      photos,
      isOwner,
      isApproved: approved,
      guardianPhone: approved ? profile.guardianPhone : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const profile = await prisma.rishtaProfile.findUnique({ where: { id } });
    if (!profile) throw new Error("NOT_FOUND");
    if (profile.userId !== user.id) throw new Error("FORBIDDEN");

    const body = await req.json();
    const parsed = rishtaProfileSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const updated = await prisma.rishtaProfile.update({
      where: { id },
      data: parsed.data as Record<string, unknown>,
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const profile = await prisma.rishtaProfile.findUnique({ where: { id } });
    if (!profile) throw new Error("NOT_FOUND");
    if (profile.userId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    await prisma.rishtaProfile.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess({ message: "Rishta profile deactivate ho gaya" });
  } catch (error) {
    return handleApiError(error);
  }
}
