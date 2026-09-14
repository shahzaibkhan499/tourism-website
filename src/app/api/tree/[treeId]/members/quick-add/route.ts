import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";

// ============================================================
// POST /api/tree/[treeId]/members/quick-add
// GenoPro-style quick relative add:
//  FATHER/MOTHER  -> new parent node at generation-1, Relationship(new -> selected)
//  BROTHER/SISTER -> same generation, copies selected's parent relationships
//  HUSBAND/WIFE   -> same generation, creates Marriage (spouse1=male, spouse2=female)
//  SON/DAUGHTER   -> generation+1, Relationship(selected -> new); optional motherId (must be a spouse of selected)
// ============================================================

type RouteCtx = { params: { treeId: string } };

const quickAddSchema = z.object({
  selectedMemberId: z.string().min(1),
  relationshipType: z.enum(["FATHER", "MOTHER", "BROTHER", "SISTER", "HUSBAND", "WIFE", "SON", "DAUGHTER"]),
  firstName: z.string().trim().min(1, "نام لکھنا ضروری ہے").max(100),
  lastName: z.string().trim().max(100).optional(),
  dateOfBirth: z.string().optional(),
  motherId: z.string().min(1).optional(),
  fatherName: z.string().trim().min(1, "والد کا نام لکھنا ضروری ہے").max(100).optional(),
});

const GENDER_OF: Record<z.infer<typeof quickAddSchema>["relationshipType"], "MALE" | "FEMALE"> = {
  FATHER: "MALE",
  MOTHER: "FEMALE",
  BROTHER: "MALE",
  SISTER: "FEMALE",
  HUSBAND: "MALE",
  WIFE: "FEMALE",
  SON: "MALE",
  DAUGHTER: "FEMALE",
};

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
    const parsed = quickAddSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const d = parsed.data;
    const treeId = params.treeId;

    const selected = await prisma.familyMember.findFirst({ where: { id: d.selectedMemberId, treeId } });
    if (!selected) return apiError(404, "ممبر نہیں ملا");

    const gender = GENDER_OF[d.relationshipType];

    // Gender guard rails: husband for females, wife for males
    if (d.relationshipType === "HUSBAND" && selected.gender !== "FEMALE") {
      return apiError(400, "Add Husband — شوہر صرف خاتون ممبر کے لیے شامل کریں");
    }
    if (d.relationshipType === "WIFE" && selected.gender !== "MALE") {
      return apiError(400, "Add Wife — بیوی صرف مرد ممبر کے لیے شامل کریں");
    }

    let generation = selected.generation;
    if (d.relationshipType === "FATHER" || d.relationshipType === "MOTHER") {
      generation = Math.max(0, selected.generation - 1);
    }
    if (d.relationshipType === "SON" || d.relationshipType === "DAUGHTER") {
      generation = selected.generation + 1;
    }

    // Validate motherId: must be a spouse of the selected member
    let motherId: string | null = null;
    if (d.motherId) {
      const spouseMarriage = await prisma.marriage.findFirst({
        where: {
          treeId,
          OR: [
            { spouse1Id: d.motherId, spouse2Id: selected.id },
            { spouse1Id: selected.id, spouse2Id: d.motherId },
          ],
        },
      });
      if (!spouseMarriage) return apiError(400, "منتخب والدہ اس ممبر کی شریک حیات نہیں ہے");
      motherId = d.motherId;
    }

    // STRICT — SON/DAUGHTER on a member with more than one spouse: the other
    // parent MUST be selected so the child lands in the correct family unit.
    // Without it the child would link to only one parent and the layout could
    // not show which marriage the child belongs to.
    if (d.relationshipType === "SON" || d.relationshipType === "DAUGHTER") {
      const spouseCount = await prisma.marriage.count({
        where: {
          treeId,
          OR: [{ spouse1Id: selected.id }, { spouse2Id: selected.id }],
        },
      });
      if (spouseCount > 1 && !motherId) {
        return apiError(400, "Mother selection is required for multiple marriages — متعدد شادیوں کے لیے والدہ کا انتخاب ضروری ہے");
      }
    }

    // FIX — BROTHER/SISTER of a member with NO parents: without a shared
    // parent the new sibling would be created with zero relationships and
    // stay alone in the tree. Require the father's name (GenoPro-style)
    // BEFORE the transaction so nothing is committed on failure.
    if (d.relationshipType === "BROTHER" || d.relationshipType === "SISTER") {
      const selectedParents = await prisma.relationship.count({ where: { childId: selected.id, treeId } });
      if (selectedParents === 0 && !d.fatherName) {
        return apiError(400, "والد کا نام لکھنا ضروری ہے — father name required to connect");
      }
    }

    // Sort order = after existing siblings in the new parent set
    let sortOrder = 1;
    if (d.relationshipType === "BROTHER" || d.relationshipType === "SISTER") {
      const parentIds = await prisma.relationship.findMany({
        where: { childId: selected.id, treeId },
        select: { parentId: true },
      });
      const ids = parentIds.map((r) => r.parentId);
      if (ids.length > 0) {
        const siblingCounts = new Map<string, number>();
        const rels = await prisma.relationship.findMany({ where: { parentId: { in: ids }, treeId }, select: { childId: true } });
        for (const r of rels) siblingCounts.set(r.childId, (siblingCounts.get(r.childId) ?? 0) + 1);
        const siblingIds: string[] = [];
        siblingCounts.forEach((count, childId) => {
          if (count === ids.length) siblingIds.push(childId);
        });
        if (siblingIds.length) {
          const aggr = await prisma.familyMember.aggregate({ where: { id: { in: siblingIds } }, _max: { sortOrder: true } });
          sortOrder = (aggr._max.sortOrder ?? 0) + 1;
        }
      }
    }

    const snapshot = await snapshotTree(treeId);
    const dob = d.dateOfBirth ? new Date(d.dateOfBirth) : null;
    const dobValue = dob && !isNaN(dob.getTime()) ? dob : null;

    const member = await prisma.$transaction(async (tx) => {
      const m = await tx.familyMember.create({
        data: {
          treeId,
          firstName: sanitizeInput(d.firstName),
          lastName: d.lastName ? sanitizeInput(d.lastName) : "",
          gender,
          dateOfBirth: dobValue,
          isAlive: true,
          generation,
          sortOrder,
          showInPublic: true,
        },
      });

      if (d.relationshipType === "FATHER" || d.relationshipType === "MOTHER") {
        await tx.relationship.create({ data: { treeId, parentId: m.id, childId: selected.id, type: "BIOLOGICAL" } });
      }

      if (d.relationshipType === "BROTHER" || d.relationshipType === "SISTER") {
        const parentRels = await tx.relationship.findMany({ where: { childId: selected.id, treeId } });
        if (parentRels.length === 0) {
          // FIX — parentless sibling: create a shared father so both the
          // selected member and the new sibling connect to the tree
          // (fatherName was validated before the transaction).
          const father = await tx.familyMember.create({
            data: {
              treeId,
              firstName: sanitizeInput((d.fatherName as string).trim()),
              lastName: d.lastName ? sanitizeInput(d.lastName) : "",
              gender: "MALE",
              generation: Math.max(0, selected.generation - 1),
              sortOrder: 0,
              showInPublic: true,
            },
          });
          await tx.relationship.create({ data: { treeId, parentId: father.id, childId: selected.id, type: "BIOLOGICAL" } });
          await tx.relationship.create({ data: { treeId, parentId: father.id, childId: m.id, type: "BIOLOGICAL" } });
        } else {
          for (const r of parentRels) {
            await tx.relationship.create({ data: { treeId, parentId: r.parentId, childId: m.id, type: r.type } });
          }
        }
      }

      if (d.relationshipType === "HUSBAND" || d.relationshipType === "WIFE") {
        const [s1, s2] = gender === "MALE" ? [m.id, selected.id] : [selected.id, m.id];
        await tx.marriage.create({ data: { treeId, spouse1Id: s1, spouse2Id: s2, status: "MARRIED", type: "NIKKAH" } });
      }

      if (d.relationshipType === "SON" || d.relationshipType === "DAUGHTER") {
        await tx.relationship.create({ data: { treeId, parentId: selected.id, childId: m.id, type: "BIOLOGICAL" } });
        if (motherId) {
          await tx.relationship.create({ data: { treeId, parentId: motherId, childId: m.id, type: "BIOLOGICAL" } });
        }
      }
      return m;
    });

    await recordVersion(treeId, user.id, "MEMBER_QUICK_ADD", snapshot, {
      memberId: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      relationshipType: d.relationshipType,
      selectedMemberId: selected.id,
    });
    await refreshTreeStats(treeId);
    await logTreeAccess(treeId, user.id, `QUICK_ADD_${d.relationshipType}`, req);

    return apiSuccess(
      {
        member: {
          id: member.id,
          treeId: member.treeId,
          firstName: member.firstName,
          lastName: member.lastName,
          nickName: member.nickName,
          gender: member.gender,
          dateOfBirth: member.dateOfBirth ? member.dateOfBirth.toISOString() : null,
          dateOfDeath: null,
          isAlive: member.isAlive,
          photo: member.photo,
          generation: member.generation,
          sortOrder: member.sortOrder,
          createdAt: member.createdAt.toISOString(),
        },
        relationshipType: d.relationshipType,
        message: "رشتہ دار شامل ہو گیا",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
