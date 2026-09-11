import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { verifySchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId]/verify — list verifications
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const [rels, marriages, members] = await Promise.all([
      prisma.relationship.findMany({ where: { treeId: params.treeId }, select: { id: true, parentId: true, childId: true } }),
      prisma.marriage.findMany({ where: { treeId: params.treeId }, select: { id: true, spouse1Id: true, spouse2Id: true } }),
      prisma.familyMember.findMany({ where: { treeId: params.treeId }, select: { id: true } }),
    ]);
    const relIds = rels.map((r) => r.id);
    const marIds = marriages.map((m) => m.id);
    const memberIds = members.map((m) => m.id);
    const verifications = await prisma.relationshipVerification.findMany({
      where: {
        OR: [
          { relationshipId: { in: relIds } },
          { marriageId: { in: marIds } },
          { memberId: { in: memberIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
      items: verifications.map((v) => ({
        id: v.id,
        relationshipId: v.relationshipId,
        marriageId: v.marriageId,
        memberId: v.memberId,
        verified: v.verified,
        note: v.note,
        createdAt: v.createdAt.toISOString(),
      })),
      relationships: rels,
      marriages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/verify — verify/dispute a relationship
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
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { relationshipId, marriageId, memberId, verified, note } = parsed.data;

    if (!relationshipId && !marriageId && !memberId) {
      return apiError(400, "رشتہ، شادی یا ممبر میں سے کوئی ایک دیں");
    }

    if (relationshipId) {
      const rel = await prisma.relationship.findFirst({
        where: { id: relationshipId, treeId: params.treeId },
      });
      if (!rel) return apiError(404, "رشتہ نہیں ملا");
    }
    if (marriageId) {
      const mar = await prisma.marriage.findFirst({
        where: { id: marriageId, treeId: params.treeId },
      });
      if (!mar) return apiError(404, "شادی نہیں ملی");
    }

    const verification = await prisma.relationshipVerification.create({
      data: {
        relationshipId: relationshipId ?? null,
        marriageId: marriageId ?? null,
        memberId: memberId ?? null,
        verifiedBy: user.id,
        verified,
        note: note ? sanitizeInput(note) : null,
      },
    });

    await logTreeAccess(params.treeId, user.id, verified ? "VERIFY" : "DISPUTE", req);

    return apiSuccess(
      {
        message: verified ? "رشتے کی تصدیق ہو گئی ✓" : "رشتے پر اعتراض درج ہو گیا",
        verification: { ...verification, createdAt: verification.createdAt.toISOString() },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
