import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { treeCreateSchema } from "@/lib/tree-validators";
import { sanitizeInput } from "@/lib/utils";

// GET /api/tree — list all trees the user owns or collaborates on
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = sanitizeInput(searchParams.get("q") ?? "");

    const [owned, collaborated] = await Promise.all([
      prisma.familyTree.findMany({
        where: {
          creatorId: user.id,
          ...(q
            ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { _count: { select: { members: true } } },
      }),
      prisma.treeCollaborator.findMany({
        where: { userId: user.id },
        take: 50,
        orderBy: { addedAt: "desc" },
        include: {
          tree: { include: { creator: { select: { id: true, name: true, image: true } }, _count: { select: { members: true } } } },
        },
      }),
    ]);

    const items = [
      ...owned.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        isPublic: t.isPublic,
        visibility: t.visibility,
        creatorId: t.creatorId,
        rootMemberId: t.rootMemberId,
        memberCount: t.memberCount,
        generationCount: t.generationCount,
        lastModified: t.lastModified.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        role: "OWNER",
        isOwner: true,
      })),
      ...collaborated.map((c) => ({
        id: c.tree.id,
        name: c.tree.name,
        description: c.tree.description,
        isPublic: c.tree.isPublic,
        visibility: c.tree.visibility,
        creatorId: c.tree.creatorId,
        rootMemberId: c.tree.rootMemberId,
        memberCount: c.tree.memberCount,
        generationCount: c.tree.generationCount,
        lastModified: c.tree.lastModified.toISOString(),
        createdAt: c.tree.createdAt.toISOString(),
        updatedAt: c.tree.updatedAt.toISOString(),
        role: c.role,
        isOwner: false,
        owner: c.tree.creator,
      })),
    ];

    return apiSuccess({ items, total: items.length });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree — create a tree (+ optional root member) and OWNER collaborator row
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = treeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }
    const { name, description, visibility, isPublic, rootMember } = parsed.data;

    const existing = await prisma.familyTree.findFirst({
      where: { creatorId: user.id, name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return apiError(400, "اسی نام سے درخت پہلے سے موجود ہے");
    }

    const tree = await prisma.$transaction(async (tx) => {
      const t = await tx.familyTree.create({
        data: {
          name: sanitizeInput(name),
          description: description ? sanitizeInput(description) : null,
          visibility: visibility ?? "PRIVATE",
          isPublic: isPublic ?? visibility === "PUBLIC",
          creatorId: user.id,
        },
      });

      let rootMemberId: string | null = null;
      if (rootMember) {
        const root = await tx.familyMember.create({
          data: {
            treeId: t.id,
            firstName: sanitizeInput(rootMember.firstName),
            lastName: rootMember.lastName ? sanitizeInput(rootMember.lastName) : "",
            gender: rootMember.gender,
            dateOfBirth: rootMember.dateOfBirth,
            dateOfDeath: rootMember.dateOfDeath,
            photo: rootMember.photo,
            birthPlace: rootMember.birthPlace,
            currentCity: rootMember.currentCity,
            occupation: rootMember.occupation,
            bio: rootMember.bio,
            generation: 1,
            sortOrder: 0,
          },
        });
        rootMemberId = root.id;
      }

      await tx.treePrivacySettings.create({ data: { treeId: t.id } });
      const updated = await tx.familyTree.update({
        where: { id: t.id },
        data: {
          rootMemberId,
          memberCount: rootMemberId ? 1 : 0,
          generationCount: 1,
          lastModified: new Date(),
        },
      });
      return updated;
    });

    return apiSuccess({ id: tree.id, name: tree.name, message: "درخت بن گیا!" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
