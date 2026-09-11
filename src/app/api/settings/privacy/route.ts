import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

const SECTION_KEYS = [
  "profile",
  "birth",
  "family",
  "relations",
  "death",
  "occupation",
  "contact",
  "education",
  "experience",
  "favorites",
  "personal",
];

// PUT: update per-section privacy (public | clan | private)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const privacy: Record<string, string> = {};
    for (const key of SECTION_KEYS) {
      if (body[key] === "public" || body[key] === "clan" || body[key] === "private") {
        privacy[key] = body[key];
      }
    }
    if (Object.keys(privacy).length === 0) {
      return apiError(400, "کوئی درست پرائیویسی آپشن منتخب کریں");
    }

    const current = ((await prisma.user.findUnique({ where: { id: user.id }, select: { privacy: true } }))?.privacy ??
      {}) as Record<string, unknown>;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { privacy: { ...current, ...privacy } as Prisma.InputJsonValue },
      select: { privacy: true },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
