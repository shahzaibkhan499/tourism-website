import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { reactionToggleSchema } from "@/lib/tree-validators";
import { assertCanEdit, resolveTreeAccess } from "@/lib/tree-access";
import { z } from "zod";

type RouteCtx = { params: { treeId: string; memberId: string } };

const bodySchema = reactionToggleSchema.extend({ commentId: z.string().min(1) });

// POST /api/tree/[treeId]/comments/[memberId]/react — toggle emoji reaction
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
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { commentId, emoji } = parsed.data;

    const comment = await prisma.memberComment.findFirst({
      where: { id: commentId, memberId: params.memberId },
    });
    if (!comment) return apiError(404, "کمنٹ نہیں ملا");

    const existing = await prisma.commentReaction.findUnique({
      where: { commentId_userId_emoji: { commentId, userId: user.id, emoji } },
    });

    if (existing) {
      await prisma.commentReaction.delete({ where: { id: existing.id } });
      return apiSuccess({ message: "ری ایکشن ہٹا دیا گیا", added: false });
    }

    await prisma.commentReaction.create({
      data: { commentId, userId: user.id, emoji },
    });
    return apiSuccess({ message: "ری ایکشن شامل ہو گیا", added: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
