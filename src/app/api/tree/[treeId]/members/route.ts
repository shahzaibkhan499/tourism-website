import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { memberInputSchema, memberQuerySchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";
import { findDuplicateCandidates } from "@/lib/duplicate-detection";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string } };

function serializeMember(m: {
  id: string; treeId: string; userId: string | null; firstName: string; lastName: string; nickName: string | null;
  gender: string; dateOfBirth: Date | null; dateOfDeath: Date | null; isAlive: boolean; photo: string | null;
  birthPlace: string | null; deathPlace: string | null; currentCity: string | null; occupation: string | null;
  education: string | null; bio: string | null; phone: string | null; email: string | null; generation: number;
  sortOrder: number; isPrivate: boolean; showInPublic: boolean; positionX: number | null; positionY: number | null;
  createdAt: Date; updatedAt: Date;
}) {
  return {
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
  };
}

// GET /api/tree/[treeId]/members — paginated member list with filters
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const { searchParams } = new URL(req.url);
    const parsed = memberQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { cursor, limit, q, gender, generation, living } = parsed.data;

    const where: Record<string, unknown> = { treeId: params.treeId };
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { nickName: { contains: q, mode: "insensitive" } },
      ];
    }
    if (gender) where.gender = gender;
    if (generation) where.generation = generation;
    if (living === "true") where.isAlive = true;
    if (living === "false") where.isAlive = false;
    if (!access.canEdit) {
      where.showInPublic = true;
      where.isPrivate = false;
    }

    const take = limit ?? 50;
    const members = await prisma.familyMember.findMany({
      where: where as never,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ generation: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const hasMore = members.length > take;
    const items = members.slice(0, take);
    return apiSuccess({
      items: items.map(serializeMember),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/members — add member with auto duplicate detection
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
    const parsed = memberInputSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const d = parsed.data;
    const treeId = params.treeId;

    // Validate parents belong to this tree
    const parentIds = d.parentIds ?? [];
    if (parentIds.length > 0) {
      const parents = await prisma.familyMember.findMany({
        where: { id: { in: parentIds }, treeId },
        select: { id: true },
      });
      if (parents.length !== new Set(parentIds).size) {
        return apiError(400, "والدین اسی درخت میں موجود نہیں ہیں");
      }
    }
    if (d.spouseId) {
      const spouse = await prisma.familyMember.findFirst({ where: { id: d.spouseId, treeId }, select: { id: true } });
      if (!spouse) return apiError(400, "شریک حیات اسی درخت میں موجود نہیں ہے");
    }

    // Generation = max(parents' generation) + 1 (or 1 for root)
    let generation = d.generation ?? 1;
    if (parentIds.length > 0) {
      const aggr = await prisma.familyMember.aggregate({
        where: { id: { in: parentIds }, treeId },
        _max: { generation: true },
      });
      generation = d.generation ?? (aggr._max.generation ?? 1) + 1;
    }

    // Sort order = after existing siblings (same parent set)
    const siblings = await prisma.relationship.findMany({ where: { parentId: { in: parentIds } }, select: { childId: true } });
    const siblingCounts = new Map<string, number>();
    for (const r of siblings) siblingCounts.set(r.childId, (siblingCounts.get(r.childId) ?? 0) + 1);
    const siblingIds: string[] = [];
    siblingCounts.forEach((count, childId) => {
      if (parentIds.length > 0 && count === parentIds.length) siblingIds.push(childId);
    });
    const siblingMax = siblingIds.length
      ? (await prisma.familyMember.aggregate({ where: { id: { in: siblingIds } }, _max: { sortOrder: true } }))._max.sortOrder ?? 0
      : 0;

    // FIX 6 — one User = one Member per tree.
    // If the payload's email/phone matches an existing User:
    //  - already linked in this tree  -> 400
    //  - not linked                    -> create WITHOUT userId + CLAIM_PROFILE invite
    const contact = (d.email && d.email.trim()) || (d.phone && d.phone.trim()) || null;
    let matchingUser: { id: string; email: string | null; phone: string | null } | null = null;
    if (contact) {
      matchingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: d.email ? d.email.trim().toLowerCase() : undefined },
            { phone: d.phone ? d.phone.trim() : undefined },
          ],
        },
        select: { id: true, email: true, phone: true },
      });
    }
    if (matchingUser) {
      // already linked via userId?
      const linkedMember = await prisma.familyMember.findFirst({
        where: { treeId, userId: matchingUser.id },
        select: { id: true },
      });
      if (linkedMember) {
        return apiError(400, "This person is already in this tree — یہ شخص پہلے سے اس شجرے میں ہے");
      }
      // already present as an unlinked member (email match) or pending CLAIM_PROFILE invite?
      const [sameEmailMember, pendingClaim] = await Promise.all([
        matchingUser.email
          ? prisma.familyMember.findFirst({
              where: { treeId, email: { equals: matchingUser.email, mode: "insensitive" } },
              select: { id: true },
            })
          : null,
        matchingUser.email
          ? prisma.treeInvite.findFirst({
              where: { treeId, inviteeEmail: { equals: matchingUser.email, mode: "insensitive" }, type: "CLAIM_PROFILE", memberId: { not: null }, status: "PENDING" },
              select: { id: true },
            })
          : null,
      ]);
      if (sameEmailMember || pendingClaim) {
        return apiError(400, "This person is already in this tree — یہ شخص پہلے سے اس شجرے میں ہے");
      }
    }

    const snapshot = await snapshotTree(treeId);

    const member = await prisma.$transaction(async (tx) => {
      const m = await tx.familyMember.create({
        data: {
          treeId,
          firstName: sanitizeInput(d.firstName),
          lastName: d.lastName ? sanitizeInput(d.lastName) : "",
          nickName: d.nickName,
          gender: d.gender,
          dateOfBirth: d.dateOfBirth,
          dateOfDeath: d.dateOfDeath,
          isAlive: d.isAlive ?? !d.dateOfDeath,
          photo: d.photo,
          birthPlace: d.birthPlace,
          deathPlace: d.deathPlace,
          currentCity: d.currentCity,
          occupation: d.occupation,
          education: d.education,
          bio: d.bio,
          phone: d.phone,
          email: d.email,
          generation,
          sortOrder: d.sortOrder ?? siblingMax + 1,
          isPrivate: d.isPrivate ?? false,
          showInPublic: d.showInPublic ?? true,
          positionX: d.positionX ?? null,
          positionY: d.positionY ?? null,
          userId: matchingUser ? null : d.userId,
        },
      });

      for (const pid of parentIds) {
        await tx.relationship.create({
          data: { treeId, parentId: pid, childId: m.id, type: "BIOLOGICAL" },
        });
      }

      if (d.spouseId) {
        const [s1, s2] = m.gender === "MALE" ? [m.id, d.spouseId] : [d.spouseId, m.id];
        await tx.marriage.create({
          data: {
            treeId,
            spouse1Id: s1,
            spouse2Id: s2,
            date: d.marriageDate ?? null,
            status: d.marriageStatus ?? "MARRIED",
            type: "NIKKAH",
          },
        });
      }
      return m;
    });

    // FIX 6 — create a CLAIM_PROFILE invite for the matched (unlinked) user
    if (matchingUser) {
      await prisma.treeInvite.create({
        data: {
          treeId,
          inviterId: user.id,
          inviteeEmail: matchingUser.email,
          inviteePhone: matchingUser.phone,
          type: "CLAIM_PROFILE",
          status: "PENDING",
          memberId: member.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        },
      });
    }

    // Duplicate detection
    const rels = await prisma.relationship.findMany({ where: { treeId } });
    const marriages = await prisma.marriage.findMany({ where: { treeId } });
    const candidates = await findDuplicateCandidates(treeId, {
      ...member,
      parentIds: rels.filter((r) => r.childId === member.id).map((r) => r.parentId),
      spouseIds: marriages
        .filter((m) => m.spouse1Id === member.id || m.spouse2Id === member.id)
        .map((m) => (m.spouse1Id === member.id ? m.spouse2Id : m.spouse1Id)),
    });

    await recordVersion(treeId, user.id, "MEMBER_ADD", snapshot, {
      memberId: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      parentIds,
      spouseId: d.spouseId ?? null,
    });
    await refreshTreeStats(treeId);
    await logTreeAccess(treeId, user.id, "ADD_MEMBER", req);

    const blocking = candidates.filter((c) => c.score >= 80);
    if (blocking.length > 0) {
      await prisma.duplicateMatch.createMany({
        data: blocking.map((c) => ({
          treeId,
          member1Id: c.member1.id,
          member2Id: c.member2.id,
          score: c.score,
        })),
      });
      return apiError(409, "DuplicateDetected", {
        message: "ممکنہ ڈپلیکیٹ ملا — پہلے تصدیق کریں",
        member,
        candidates: blocking,
      });
    }

    const warnings = candidates.filter((c) => c.score >= 60);
    if (warnings.length > 0) {
      await prisma.duplicateMatch.createMany({
        data: warnings.map((c) => ({
          treeId,
          member1Id: c.member1.id,
          member2Id: c.member2.id,
          score: c.score,
        })),
      });
    }

    return apiSuccess(
      { member: serializeMember(member), warnings, message: warnings.length > 0 ? "ممبر شامل ہو گیا — ممکنہ ڈپلیکیٹ چیک کریں" : "ممبر شامل ہو گیا" },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
