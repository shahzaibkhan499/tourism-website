import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";

// Round 10 — lightweight user search for the event-invite picker
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) return apiSuccess({ items: [] });

    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, image: true },
      take: 10,
    });

    return apiSuccess({ items: users });
  } catch (error) {
    return handleApiError(error);
  }
}
