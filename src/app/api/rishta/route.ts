import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rishtaProfileSchema, rishtaQuerySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { mapRishtaInput } from "@/lib/rishta-mapping";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const parsed = rishtaQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { gender, minAge, maxAge, education, profession, sect, city, maritalStatus, caste, cursor, limit } =
      parsed.data;

    const where: any = { isActive: true };
    if (gender) where.user = { gender: gender.toUpperCase() };
    if (minAge !== undefined || maxAge !== undefined) {
      where.age = {};
      if (minAge !== undefined) (where.age as Record<string, unknown>).gte = minAge;
      if (maxAge !== undefined) (where.age as Record<string, unknown>).lte = maxAge;
    }
    if (education) where.education = education;
    if (profession) where.profession = { contains: profession, mode: "insensitive" };
    if (sect) where.sect = sect;
    if (city) where.cityPreference = { contains: city, mode: "insensitive" };
    if (maritalStatus) where.maritalStatus = maritalStatus;
    if (caste) where.castePreference = { contains: caste, mode: "insensitive" };

    const profiles = await prisma.rishtaProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            gender: true,
            city: true,
            clan: { select: { id: true, name: true } },
          },
        },
      },
    });

    const hasMore = profiles.length > limit;
    const items = hasMore ? profiles.slice(0, limit) : profiles;

    return apiSuccess({
      items,
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
    const parsed = rishtaProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;
    const data = mapRishtaInput(d) as Record<string, unknown>;

    const profile = await prisma.rishtaProfile.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return apiSuccess(profile, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
