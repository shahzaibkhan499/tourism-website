import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { duplicateResolveSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// POST /api/tree/[treeId]/duplicates/resolve — merge or skip a duplicate pair
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = duplicateResolveSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { member1Id, member2Id, action } = parsed.data;

    const [m1, m2] = await Promise.all([
      prisma.familyMember.findFirst({ where: { id: member1Id, treeId: params.treeId } }),
      prisma.familyMember.findFirst({ where: { id: member2Id, treeId: params.treeId } }),
    ]);
    if (!m1 || !m2) return apiError(404, "ممبر نہیں ملا");
    if (member1Id === member2Id) return apiError(400, "ایک ہی ممبر منتخب نہیں ہو سکتا");

    const before = await snapshotTree(params.treeId);

    if (action === "SKIP") {
      await prisma.$transaction(async (tx) => {
        const match = await tx.duplicateMatch.findUnique({
          where: { member1Id_member2Id: { member1Id, member2Id } },
        });
        if (match) {
          await tx.duplicateMatch.update({
            where: { id: match.id },
            data: { status: "CONFIRMED_DIFFERENT", resolvedBy: user.id, resolvedAt: new Date() },
          });
        }
      });
      await recordVersion(params.treeId, user.id, "DUPLICATE_SKIP", before, {
        member1Id,
        member2Id,
      });
      await logTreeAccess(params.treeId, user.id, "DUPLICATE_SKIP", req);
      return apiSuccess({ message: "ڈپلیکیٹ کو چھوڑ دیا گیا — مختلف افراد", status: "CONFIRMED_DIFFERENT" });
    }

    // MERGE: keep member1, absorb member2
    await prisma.$transaction(async (tx) => {
      // relationships: member2 as child → member1
      const rels2 = await tx.relationship.findMany({ where: { childId: member2Id } });
      for (const r of rels2) {
        const exists = await tx.relationship.findUnique({
          where: { parentId_childId: { parentId: r.parentId, childId: member1Id } },
        });
        if (!exists) {
          await tx.relationship.create({
            data: { treeId: params.treeId, parentId: r.parentId, childId: member1Id, type: r.type },
          });
        }
      }
      // member2 as parent
      const rels2p = await tx.relationship.findMany({ where: { parentId: member2Id } });
      for (const r of rels2p) {
        const exists = await tx.relationship.findUnique({
          where: { parentId_childId: { parentId: member1Id, childId: r.childId } },
        });
        if (!exists) {
          await tx.relationship.create({
            data: { treeId: params.treeId, parentId: member1Id, childId: r.childId, type: r.type },
          });
        }
      }
      // marriages
      const marrs = await tx.marriage.findMany({
        where: { OR: [{ spouse1Id: member2Id }, { spouse2Id: member2Id }] },
      });
      for (const m of marrs) {
        const s1 = m.spouse1Id === member2Id ? member1Id : m.spouse1Id;
        const s2 = m.spouse2Id === member2Id ? member1Id : m.spouse2Id;
        if (s1 === s2) continue;
        const exists = await tx.marriage.findFirst({
          where: { OR: [{ spouse1Id: s1, spouse2Id: s2 }, { spouse1Id: s2, spouse2Id: s1 }] },
        });
        if (!exists) {
          await tx.marriage.create({
            data: {
              treeId: params.treeId,
              spouse1Id: s1,
              spouse2Id: s2,
              date: m.date,
              endDate: m.endDate,
              location: m.location,
              status: m.status,
              type: m.type,
              sortOrder: m.sortOrder,
            },
          });
        }
      }
      // comments / events / stories / photo tags
      await tx.memberComment.updateMany({ where: { memberId: member2Id }, data: { memberId: member1Id } });
      await tx.memberLifeEvent.updateMany({ where: { memberId: member2Id }, data: { memberId: member1Id } });
      await tx.memberStory.updateMany({ where: { memberId: member2Id }, data: { memberId: member1Id } });
      await tx.groupPhotoTag.updateMany({ where: { memberId: member2Id }, data: { memberId: member1Id } });
      await tx.relationshipVerification.updateMany({ where: { memberId: member2Id }, data: { memberId: member1Id } });
      // keep richer member data
      const mergeField = (a: string | null, b: string | null) => a || b;
      await tx.familyMember.update({
        where: { id: member1Id },
        data: {
          nickName: mergeField(m1.nickName, m2.nickName),
          dateOfBirth: m1.dateOfBirth ?? m2.dateOfBirth,
          dateOfDeath: m1.dateOfDeath ?? m2.dateOfDeath,
          birthPlace: mergeField(m1.birthPlace, m2.birthPlace),
          deathPlace: mergeField(m1.deathPlace, m2.deathPlace),
          currentCity: mergeField(m1.currentCity, m2.currentCity),
          occupation: mergeField(m1.occupation, m2.occupation),
          education: mergeField(m1.education, m2.education),
          bio: mergeField(m1.bio, m2.bio),
          phone: mergeField(m1.phone, m2.phone),
          email: mergeField(m1.email, m2.email),
          photo: mergeField(m1.photo, m2.photo),
          isAlive: m1.isAlive && m2.isAlive,
          showInPublic: m1.showInPublic && m2.showInPublic,
          isPrivate: m1.isPrivate || m2.isPrivate,
        },
      });
      // delete member2 (cascade cleans leftover rels)
      await tx.familyMember.delete({ where: { id: member2Id } });
      // mark match merged
      const match = await tx.duplicateMatch.findUnique({
        where: { member1Id_member2Id: { member1Id, member2Id } },
      });
      if (match) {
        await tx.duplicateMatch.update({
          where: { id: match.id },
          data: { status: "MERGED", resolvedBy: user.id, resolvedAt: new Date() },
        });
      }
    });

    await recordVersion(params.treeId, user.id, "DUPLICATE_MERGE", before, {
      kept: member1Id,
      removed: member2Id,
    });
    await logTreeAccess(params.treeId, user.id, "DUPLICATE_MERGE", req);

    return apiSuccess({ message: "دونوں ممبرز ملا دیے گئے ✓", keptMemberId: member1Id, status: "MERGED" });
  } catch (error) {
    return handleApiError(error);
  }
}
