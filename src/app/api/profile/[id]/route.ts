import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireUser();
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        gender: true,
        dateOfBirth: true,
        city: true,
        province: true,
        bio: true,
        bloodGroup: true,
        occupation: true,
        education: true,
        isVerified: true,
        createdAt: true,
        clan: { select: { id: true, name: true, nameUrdu: true } },
        subClan: { select: { id: true, name: true, nameUrdu: true } },
      },
    });

    if (!user) throw new Error("NOT_FOUND");

    const isOwn = user.id === currentUser.id;

    return apiSuccess({
      ...user,
      email: isOwn ? user.email : undefined,
      isOwn,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
