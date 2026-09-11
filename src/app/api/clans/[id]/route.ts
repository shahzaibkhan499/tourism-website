import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const memberQuery = searchParams.get("memberQuery") || "";
    const subClanFilter = searchParams.get("subClan") || "";

    const clan = await prisma.clan.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, nameUrdu: true, region: true } },
        subClans: {
          where: { isActive: true },
          include: { _count: { select: { members: true } } },
          orderBy: { name: "asc" },
        },
        _count: { select: { members: true, subClans: true } },
      },
    });

    if (!clan) throw new Error("NOT_FOUND");

    const memberWhere: any = { clanId: id, isActive: true };
    if (memberQuery) {
      memberWhere.OR = [
        { name: { contains: memberQuery, mode: "insensitive" } },
        { city: { contains: memberQuery, mode: "insensitive" } },
      ];
    }
    if (subClanFilter) memberWhere.subClanId = subClanFilter;

    const members = await prisma.user.findMany({
      where: memberWhere,
      select: {
        id: true,
        name: true,
        image: true,
        city: true,
        subClan: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    return apiSuccess({ ...clan, members });
  } catch (error) {
    return handleApiError(error);
  }
}
