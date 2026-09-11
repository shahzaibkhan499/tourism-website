import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { inviteRespondSchema } from "@/lib/tree-validators";
import { logTreeAccess } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string; token: string } };

// GET /api/tree/[treeId]/invite/[token] — invite details
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const invite = await prisma.treeInvite.findUnique({
      where: { token: params.token },
      include: {
        tree: {
          select: { id: true, name: true, description: true },
        },
      },
    });
    if (!invite || invite.treeId !== params.treeId) return apiError(404, "دعوت نہیں ملی");

    const memberName = invite.memberId
      ? await prisma.familyMember.findUnique({
          where: { id: invite.memberId },
          select: { firstName: true, lastName: true },
        })
      : null;

    return apiSuccess({
      id: invite.id,
      treeId: invite.treeId,
      type: invite.type,
      status: invite.status,
      inviteeEmail: invite.inviteeEmail,
      inviteeName: invite.inviteeName,
      memberId: invite.memberId,
      memberName,
      message: invite.message,
      tree: invite.tree,
      expiresAt: invite.expiresAt.toISOString(),
      respondedAt: invite.respondedAt?.toISOString() ?? null,
      createdAt: invite.createdAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/invite/[token] — accept/reject invite
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = inviteRespondSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const invite = await prisma.treeInvite.findUnique({
      where: { token: params.token },
    });
    if (!invite || invite.treeId !== params.treeId) return apiError(404, "دعوت نہیں ملی");
    if (invite.status !== "PENDING") return apiError(400, "یہ دعوت پہلے ہی مکمل ہو چکی ہے");
    if (invite.expiresAt < new Date()) {
      await prisma.treeInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      return apiError(400, "دعوت کی میعاد ختم ہو گئی ہے");
    }

    if (!parsed.data.accept) {
      await prisma.treeInvite.update({
        where: { id: invite.id },
        data: { status: "REJECTED", respondedAt: new Date() },
      });
      return apiSuccess({ message: "دعوت مسترد کر دی گئی", status: "REJECTED" });
    }

    await prisma.$transaction(async (tx) => {
      if (invite.type === "COLLABORATE" || invite.type === "VIEW" || invite.type === "MERGE") {
        const existing = await tx.treeCollaborator.findUnique({
          where: { treeId_userId: { treeId: invite.treeId, userId: user.id } },
        });
        if (!existing) {
          await tx.treeCollaborator.create({
            data: {
              treeId: invite.treeId,
              userId: user.id,
              role: invite.type === "VIEW" ? "VIEWER" : invite.type === "MERGE" ? "EDITOR" : "EDITOR",
              addedById: invite.inviterId,
            },
          });
        }
      }
      if (invite.type === "CLAIM_PROFILE" && invite.memberId) {
        await tx.familyMember.update({
          where: { id: invite.memberId },
          data: { userId: user.id },
        });
      }
      await tx.treeInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
    });

    await logTreeAccess(params.treeId, user.id, "INVITE_ACCEPTED", req);

    return apiSuccess({
      message: "دعوت قبول کر لی گئی ✓",
      status: "ACCEPTED",
      treeId: invite.treeId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
