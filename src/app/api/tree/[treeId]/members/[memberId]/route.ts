import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { memberUpdateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";
import { z } from "zod";

type RouteCtx = { params: { treeId: string; memberId: string } };

const deleteBodySchema = z.object({
  reassignToId: z.string().min(1).optional().nullable(),
  deleteChildren: z.boolean().optional(),
});

// PUT /api/tree/[treeId]/members/[memberId] — update member fields
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const existing = await prisma.familyMember.findFirst({
      where: { id: params.memberId, treeId: params.treeId },
    });
    if (!existing) return apiError(404, "ممبر نہیں ملا");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = memberUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const d = parsed.data;

    if (d.dateOfDeath && existing.dateOfBirth && d.dateOfDeath < existing.dateOfBirth) {
      return apiError(400, "تاریخ وفات تاریخ پیدائش سے پہلے نہیں ہو سکتی");
    }
    if (d.dateOfBirth && d.dateOfDeath && d.dateOfBirth > d.dateOfDeath) {
      return apiError(400, "تاریخ پیدائش تاریخ وفات کے بعد نہیں ہو سکتی");
    }

    const snapshot = await snapshotTree(params.treeId);

    const updated = await prisma.familyMember.update({
      where: { id: params.memberId },
      data: {
        ...(d.firstName !== undefined ? { firstName: sanitizeInput(d.firstName) } : {}),
        ...(d.lastName !== undefined ? { lastName: d.lastName ? sanitizeInput(d.lastName) : "" } : {}),
        ...(d.nickName !== undefined ? { nickName: d.nickName } : {}),
        ...(d.gender !== undefined ? { gender: d.gender } : {}),
        ...(d.dateOfBirth !== undefined ? { dateOfBirth: d.dateOfBirth } : {}),
        ...(d.dateOfDeath !== undefined ? { dateOfDeath: d.dateOfDeath } : {}),
        ...(d.isAlive !== undefined ? { isAlive: d.isAlive } : {}),
        ...(d.photo !== undefined ? { photo: d.photo } : {}),
        ...(d.birthPlace !== undefined ? { birthPlace: d.birthPlace } : {}),
        ...(d.deathPlace !== undefined ? { deathPlace: d.deathPlace } : {}),
        ...(d.currentCity !== undefined ? { currentCity: d.currentCity } : {}),
        ...(d.occupation !== undefined ? { occupation: d.occupation } : {}),
        ...(d.education !== undefined ? { education: d.education } : {}),
        ...(d.bio !== undefined ? { bio: d.bio } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(d.email !== undefined ? { email: d.email } : {}),
        ...(d.generation !== undefined ? { generation: d.generation } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        ...(d.isPrivate !== undefined ? { isPrivate: d.isPrivate } : {}),
        ...(d.showInPublic !== undefined ? { showInPublic: d.showInPublic } : {}),
        ...(d.positionX !== undefined ? { positionX: d.positionX ?? null } : {}),
        ...(d.positionY !== undefined ? { positionY: d.positionY ?? null } : {}),
      },
    });

    await recordVersion(params.treeId, user.id, "MEMBER_UPDATE", snapshot, { memberId: params.memberId, fields: Object.keys(d) });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "EDIT_MEMBER", req);

    return apiSuccess({
      message: "ممبر اپ ڈیٹ ہو گیا",
      member: {
        ...updated,
        dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.toISOString() : null,
        dateOfDeath: updated.dateOfDeath ? updated.dateOfDeath.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId]/members/[memberId] — delete member; children can be
// reassigned to another parent (or deleted with deleteChildren:true)
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const member = await prisma.familyMember.findFirst({
      where: { id: params.memberId, treeId: params.treeId },
    });
    if (!member) return apiError(404, "ممبر نہیں ملا");

    const body = await req.json().catch(() => ({}));
    const parsed = deleteBodySchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { reassignToId, deleteChildren } = parsed.data;

    // Children of this member (as parent)
    const childRels = await prisma.relationship.findMany({ where: { parentId: params.memberId } });
    if (childRels.length > 0 && !reassignToId && !deleteChildren) {
      return apiError(409, "ChildrenExist", {
        message: "اس ممبر کے بچے موجود ہیں — پہلے انہیں کسی اور والدین کے حوالے کریں یا ڈیلیٹ کریں",
        childrenCount: childRels.length,
      });
    }

    let reassignTargetId: string | null = reassignToId ?? null;
    if (reassignTargetId) {
      const target = await prisma.familyMember.findFirst({
        where: { id: reassignTargetId, treeId: params.treeId },
      });
      if (!target) return apiError(404, "نئے والدین نہیں ملے");
      // prevent self-loop and cross-generation nonsense
      if (target.id === member.id) return apiError(400, "اپنے آپ کو والدین نہیں بنایا جا سکتا");
    }

    const snapshot = await snapshotTree(params.treeId);

    await prisma.$transaction(async (tx) => {
      if (childRels.length > 0) {
        if (deleteChildren) {
          const childIds = childRels.map((r) => r.childId);
          await tx.relationship.deleteMany({ where: { childId: { in: childIds } } });
          await tx.marriage.deleteMany({
            where: { OR: [{ spouse1Id: { in: childIds } }, { spouse2Id: { in: childIds } }] },
          });
          await tx.memberComment.deleteMany({ where: { memberId: { in: childIds } } });
          await tx.memberLifeEvent.deleteMany({ where: { memberId: { in: childIds } } });
          await tx.memberStory.deleteMany({ where: { memberId: { in: childIds } } });
          await tx.memberPrivacy.deleteMany({ where: { memberId: { in: childIds } } });
          await tx.familyMember.deleteMany({ where: { id: { in: childIds } } });
        } else if (reassignTargetId) {
          for (const rel of childRels) {
            const existing = await tx.relationship.findUnique({
              where: { parentId_childId: { parentId: reassignTargetId, childId: rel.childId } },
            });
            if (existing) {
              await tx.relationship.delete({ where: { id: rel.id } });
            } else {
              await tx.relationship.update({
                where: { id: rel.id },
                data: { parentId: reassignTargetId, type: "ADOPTED" },
              });
            }
          }
        }
      }

      await tx.relationship.deleteMany({ where: { childId: params.memberId } });
      await tx.marriage.deleteMany({
        where: { OR: [{ spouse1Id: params.memberId }, { spouse2Id: params.memberId }] },
      });
      await tx.memberComment.deleteMany({ where: { memberId: params.memberId } });
      await tx.memberLifeEvent.deleteMany({ where: { memberId: params.memberId } });
      await tx.memberStory.deleteMany({ where: { memberId: params.memberId } });
      await tx.memberPrivacy.deleteMany({ where: { memberId: params.memberId } });
      await tx.relationshipVerification.deleteMany({ where: { memberId: params.memberId } });
      await tx.familyMember.delete({ where: { id: params.memberId } });
    });

    await recordVersion(params.treeId, user.id, "MEMBER_DELETE", snapshot, {
      memberId: params.memberId,
      reassignedTo: reassignTargetId,
      deletedChildren: Boolean(deleteChildren),
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "DELETE_MEMBER", req);

    return apiSuccess({ message: deleteChildren ? "ممبر اور اس کے بچے ڈیلیٹ ہو گئے" : "ممبر ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
