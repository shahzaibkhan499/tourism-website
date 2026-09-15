import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";

// NOTE: "family", "relations" and "death" sections were removed from the base
// user profile — that data belongs exclusively in the Family Tree module.
// "education" (old single-entry JSON section) was replaced by User.educations.
const SECTION_KEYS = [
  "birth",
  "occupation",
  "contact",
  "experience",
  "favorites",
  "personal",
] as const;

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
        clanId: true,
        subClanId: true,
        nameTitle: true,
        nickname: true,
        displayName: true,
        cast: true,
        origin: true,
        maritalStatus: true,
        cnic: true,
        birthPlace: true,
        extendedProfile: true,
        educations: true,
        privacy: true,
        occupationProfile: true,
        clan: { select: { id: true, name: true, nameUrdu: true } },
        subClan: { select: { id: true, name: true, nameUrdu: true } },
      },
    });

    if (!user) throw new Error("NOT_FOUND");

    const isOwn = user.id === currentUser.id;
    const privacy = (user.privacy ?? {}) as Record<string, string>;
    const extended = (user.extendedProfile ?? {}) as Record<string, unknown>;
    const sameClan = Boolean(user.clanId && user.clanId === currentUser.clanId);

    const canView = (section: string) => {
      if (isOwn) return true;
      const level = privacy[section] ?? "public";
      if (level === "private") return false;
      if (level === "clan") return sameClan;
      return true;
    };

    const sections: Record<string, unknown> = {};
    for (const key of SECTION_KEYS) {
      if (canView(key)) sections[key] = extended[key] ?? null;
    }

    const occupation =
      canView("occupation") && user.occupationProfile
        ? {
            employmentStatus: user.occupationProfile.employmentStatus,
            jobType: user.occupationProfile.jobType,
            details: user.occupationProfile.details,
          }
        : null;

    return apiSuccess({
      ...user,
      email: isOwn ? user.email : undefined,
      isOwn,
      cnic: isOwn ? user.cnic : undefined,
      occupationProfile: occupation,
      sections,
      privacy: undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
