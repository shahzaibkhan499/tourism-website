import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { inviteCreateSchema } from "@/lib/tree-validators";
import { assertCanInvite, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string } };

// POST /api/tree/[treeId]/invite — send invite (VIEW / COLLABORATE / MERGE / CLAIM_PROFILE)
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanInvite(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = inviteCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { inviteeEmail, inviteePhone, inviteeName, type, memberId, message, daysValid } = parsed.data;

    if (!inviteeEmail && !inviteePhone) {
      return apiError(400, "ای میل یا فون نمبر درکار ہے");
    }

    if (type === "CLAIM_PROFILE" && !memberId) {
      return apiError(400, "CLAIM_PROFILE کے لیے ممبر منتخب کریں");
    }

    const expiresAt = new Date(Date.now() + (daysValid ?? 7) * 24 * 3600 * 1000);

    const invite = await prisma.treeInvite.create({
      data: {
        treeId: params.treeId,
        inviterId: user.id,
        inviteeEmail: inviteeEmail,
        inviteePhone: inviteePhone,
        inviteeName: inviteeName ? sanitizeInput(inviteeName) : null,
        type,
        status: "PENDING",
        memberId: memberId ?? null,
        message: message ? sanitizeInput(message) : null,
        expiresAt,
      },
    });

    await logTreeAccess(params.treeId, user.id, "INVITE_SENT", req);

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/tree/invite/${invite.token}`;

    return apiSuccess(
      {
        message: "دعوت بھیج دی گئی",
        invite: {
          id: invite.id,
          token: invite.token,
          inviteUrl,
          type: invite.type,
          status: invite.status,
          expiresAt: invite.expiresAt.toISOString(),
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// GET /api/tree/[treeId]/invite — list invites (inviter/editor only)
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanInvite(access);
    if (denied) return apiError(denied.status, denied.message);

    const invites = await prisma.treeInvite.findMany({
      where: { treeId: params.treeId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({
      items: invites.map((i) => ({
        id: i.id,
        treeId: i.treeId,
        inviteeEmail: i.inviteeEmail,
        inviteePhone: i.inviteePhone,
        inviteeName: i.inviteeName,
        type: i.type,
        status: i.status,
        token: i.token,
        memberId: i.memberId,
        message: i.message,
        expiresAt: i.expiresAt.toISOString(),
        respondedAt: i.respondedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
