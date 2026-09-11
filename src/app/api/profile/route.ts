import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        city: true,
        province: true,
        clanId: true,
        subClanId: true,
        bio: true,
        bloodGroup: true,
        occupation: true,
        education: true,
        isVerified: true,
        role: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
        clan: { select: { id: true, name: true, nameUrdu: true } },
        subClan: { select: { id: true, name: true, nameUrdu: true } },
        _count: {
          select: { events: true, memories: true, media: true, businesses: true },
        },
      },
    });

    if (!profile) throw new Error("NOT_FOUND");

    const rishtaProfile = await prisma.rishtaProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, isActive: true, isVerified: true },
    });

    const jobProfile = await prisma.jobProfile.findUnique({ where: { userId: user.id } });

    return apiSuccess({ ...profile, rishtaProfile, jobProfile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = profileSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;
    const data: any = {};

    if (d.name !== undefined) data.name = sanitizeInput(d.name);
    if (d.phone !== undefined) {
      if (d.phone) {
        const existing = await prisma.user.findFirst({
          where: { phone: d.phone, id: { not: user.id } },
        });
        if (existing) return apiError(400, "Yeh phone number kisi aur ka hai");
        data.phone = d.phone;
      } else {
        data.phone = null;
      }
    }
    if (d.gender !== undefined) data.gender = d.gender;
    if (d.dateOfBirth !== undefined) data.dateOfBirth = d.dateOfBirth ? new Date(d.dateOfBirth) : null;
    if (d.city !== undefined) data.city = d.city;
    if (d.province !== undefined) data.province = d.province;
    if (d.bio !== undefined) data.bio = d.bio;
    if (d.bloodGroup !== undefined) data.bloodGroup = d.bloodGroup;
    if (d.occupation !== undefined) data.occupation = d.occupation;
    if (d.education !== undefined) data.education = d.education;
    if (d.clanId !== undefined) data.clanId = d.clanId;
    if (d.subClanId !== undefined) data.subClanId = d.subClanId;

    // Handle image separately (allows null)
    if ("image" in body) data.image = body.image ?? null;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        city: true,
        province: true,
        clanId: true,
        subClanId: true,
        bio: true,
        bloodGroup: true,
        occupation: true,
        education: true,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
