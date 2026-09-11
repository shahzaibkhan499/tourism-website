import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { treeUpdateSchema } from "@/lib/tree-validators";
import { applyPrivacyToMembers, assertCanDelete, assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId] — full tree graph (members + relationships + marriages)
// Public view allowed only when visibility PUBLIC/isPublic; privacy enforced for non-editors.
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const treeId = access.tree.id;

    await logTreeAccess(treeId, access.user?.id ?? null, "VIEW_TREE", req);

    const [membersRaw, relationships, marriages, creator] = await Promise.all([
      prisma.familyMember.findMany({
        where: { treeId },
        include: { memberPrivacy: true },
        orderBy: [{ generation: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.relationship.findMany({ where: { treeId } }),
      prisma.marriage.findMany({ where: { treeId }, orderBy: { sortOrder: "asc" } }),
      prisma.user.findUnique({
        where: { id: access.tree.creatorId },
        select: { id: true, name: true, image: true },
      }),
    ]);

    const members = applyPrivacyToMembers(membersRaw, access);

    // Editors see everything; viewers only see marriages between visible members
    const visibleIds = new Set(members.map((m) => m.id));
    const visibleRelationships = relationships.filter(
      (r) => visibleIds.has(r.parentId) && visibleIds.has(r.childId)
    );
    const visibleMarriages = marriages.filter(
      (m) => visibleIds.has(m.spouse1Id) && visibleIds.has(m.spouse2Id)
    );

    const serializeMember = (m: (typeof members)[number]) => ({
      id: m.id,
      treeId: m.treeId,
      userId: m.userId,
      firstName: m.firstName,
      lastName: m.lastName,
      nickName: m.nickName,
      gender: m.gender,
      dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
      dateOfDeath: m.dateOfDeath ? m.dateOfDeath.toISOString() : null,
      isAlive: m.isAlive,
      photo: m.photo,
      birthPlace: m.birthPlace,
      deathPlace: m.deathPlace,
      currentCity: m.currentCity,
      occupation: m.occupation,
      education: m.education,
      bio: m.bio,
      phone: m.phone,
      email: m.email,
      generation: m.generation,
      sortOrder: m.sortOrder,
      isPrivate: m.isPrivate,
      showInPublic: m.showInPublic,
      positionX: m.positionX,
      positionY: m.positionY,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    });

    return apiSuccess({
      tree: {
        id: access.tree.id,
        name: access.tree.name,
        description: access.tree.description,
        isPublic: access.tree.isPublic,
        visibility: access.tree.visibility,
        creatorId: access.tree.creatorId,
        rootMemberId: access.tree.rootMemberId,
        memberCount: access.tree.memberCount,
        generationCount: access.tree.generationCount,
        lastModified: access.tree.lastModified.toISOString(),
        createdAt: access.tree.createdAt.toISOString(),
        updatedAt: access.tree.updatedAt.toISOString(),
        creator,
      },
      members: members.map(serializeMember),
      relationships: visibleRelationships.map((r) => ({
        id: r.id,
        parentId: r.parentId,
        childId: r.childId,
        type: r.type,
        treeId: r.treeId,
      })),
      marriages: visibleMarriages.map((m) => ({
        id: m.id,
        spouse1Id: m.spouse1Id,
        spouse2Id: m.spouse2Id,
        treeId: m.treeId,
        date: m.date ? m.date.toISOString() : null,
        endDate: m.endDate ? m.endDate.toISOString() : null,
        location: m.location,
        status: m.status,
        type: m.type,
        sortOrder: m.sortOrder,
      })),
      viewerRole: access.role,
      canEdit: access.canEdit,
      canDelete: access.canDelete,
      canInvite: access.canInvite,
      privacy: access.privacy ?? {
        showLiving: true,
        showFemales: true,
        showPhotos: true,
        showDates: true,
        showPlaces: true,
        showOccupation: true,
        showBio: true,
        showContact: false,
        watermarkPhotos: true,
        allowDownload: false,
        allowExport: false,
      },
      rootMemberId: access.tree.rootMemberId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/tree/[treeId] — update name/description/visibility
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = treeUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const data = parsed.data;

    if (data.name && !access.canManageRoles && access.role === "VIEWER") {
      return apiError(403, "ویور صرف دیکھ سکتا ہے");
    }

    const updated = await prisma.familyTree.update({
      where: { id: params.treeId },
      data: {
        ...(data.name !== undefined ? { name: sanitizeInput(data.name) } : {}),
        ...(data.description !== undefined ? { description: data.description ? sanitizeInput(data.description) : null } : {}),
        ...(data.visibility !== undefined ? { visibility: data.visibility } : {}),
        ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
        lastModified: new Date(),
      },
    });

    await prisma.treeVersion.create({
      data: {
        treeId: params.treeId,
        userId: user.id,
        action: "TREE_UPDATE",
        snapshot: { name: access.tree.name, description: access.tree.description, visibility: access.tree.visibility },
        changes: data as never,
      },
    });

    return apiSuccess({ message: "درخت اپ ڈیٹ ہو گیا", tree: { id: updated.id, name: updated.name, description: updated.description, visibility: updated.visibility, isPublic: updated.isPublic } });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId] — delete whole tree (owner only; members/comments cascade)
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanDelete(access);
    if (denied) return apiError(denied.status, denied.message);

    await prisma.$transaction([
      prisma.treeVersion.deleteMany({ where: { treeId: params.treeId } }),
      prisma.treeAccessLog.deleteMany({ where: { treeId: params.treeId } }),
      prisma.treeMergeRequest.deleteMany({ where: { OR: [{ sourceTreeId: params.treeId }, { targetTreeId: params.treeId }] } }),
      prisma.treeInvite.deleteMany({ where: { treeId: params.treeId } }),
      prisma.treeCollaborator.deleteMany({ where: { treeId: params.treeId } }),
      prisma.treePrivacySettings.deleteMany({ where: { treeId: params.treeId } }),
      prisma.memberComment.deleteMany({ where: { member: { treeId: params.treeId } } }),
      prisma.memberLifeEvent.deleteMany({ where: { member: { treeId: params.treeId } } }),
      prisma.memberStory.deleteMany({ where: { member: { treeId: params.treeId } } }),
      prisma.memberPrivacy.deleteMany({ where: { member: { treeId: params.treeId } } }),
      prisma.relationshipVerification.deleteMany({ where: { member: { treeId: params.treeId } } }),
      prisma.relationship.deleteMany({ where: { treeId: params.treeId } }),
      prisma.marriage.deleteMany({ where: { treeId: params.treeId } }),
      prisma.familyMember.deleteMany({ where: { treeId: params.treeId } }),
      prisma.groupPhotoTag.deleteMany({ where: { photo: { treeId: params.treeId } } }),
      prisma.groupPhoto.deleteMany({ where: { treeId: params.treeId } }),
      prisma.familyTree.delete({ where: { id: params.treeId } }),
    ]);

    return apiSuccess({ message: "درخت ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
