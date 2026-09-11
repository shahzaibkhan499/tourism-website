import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { memberPrivacyUpdateSchema, privacyUpdateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId]/privacy — tree + member privacy settings
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;

    const [privacy, memberPrivacies, members] = await Promise.all([
      prisma.treePrivacySettings.findUnique({ where: { treeId: params.treeId } }),
      prisma.memberPrivacy.findMany({
        where: { member: { treeId: params.treeId } },
        include: { member: { select: { id: true, firstName: true, lastName: true, gender: true, photo: true } } },
      }),
      prisma.familyMember.findMany({
        where: { treeId: params.treeId },
        select: { id: true, firstName: true, lastName: true, gender: true, photo: true, isPrivate: true },
      }),
    ]);

    return apiSuccess({
      canEdit: access.canEdit,
      privacy,
      memberPrivacies: memberPrivacies.map((mp) => ({
        id: mp.id,
        memberId: mp.memberId,
        isHidden: mp.isHidden,
        hidePhoto: mp.hidePhoto,
        hideDates: mp.hideDates,
        hideBio: mp.hideBio,
        hideContact: mp.hideContact,
        member: mp.member,
      })),
      members,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/tree/[treeId]/privacy — update tree-level privacy (owner/admin only)
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    if (!access.canManageRoles) return apiError(403, "صرف مالک یا ایڈمن ہی رازداری بدل سکتے ہیں");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = privacyUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const privacy = await prisma.treePrivacySettings.upsert({
      where: { treeId: params.treeId },
      create: { treeId: params.treeId, ...parsed.data },
      update: { ...parsed.data },
    });

    await logTreeAccess(params.treeId, user.id, "PRIVACY_UPDATED", req);

    return apiSuccess({ message: "رازداری کی ترتیبات محفوظ ہو گئیں", privacy });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/privacy — update member-level privacy (body: {memberId, ...memberPrivacyUpdate})
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
    const parsed = memberPrivacyUpdateSchema
      .extend({ memberId: z.string().min(1) })
      .safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { memberId, ...data } = parsed.data;

    const member = await prisma.familyMember.findFirst({
      where: { id: memberId, treeId: params.treeId },
    });
    if (!member) return apiError(404, "ممبر نہیں ملا");

    const mp = await prisma.memberPrivacy.upsert({
      where: { memberId },
      create: { memberId, ...data },
      update: { ...data },
    });

    await logTreeAccess(params.treeId, user.id, "MEMBER_PRIVACY_UPDATED", req);

    return apiSuccess({ message: "ممبر کی رازداری محفوظ ہو گئی", memberPrivacy: mp });
  } catch (error) {
    return handleApiError(error);
  }
}
