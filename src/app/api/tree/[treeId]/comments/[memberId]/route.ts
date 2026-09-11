import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { commentCreateSchema, commentUpdateSchema } from "@/lib/tree-validators";
import { assertCanEdit, resolveTreeAccess } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";
import { z } from "zod";

type RouteCtx = { params: { treeId: string; memberId: string } };

const deleteBodySchema = z.object({ commentId: z.string().min(1) });
const editBodySchema = commentUpdateSchema.extend({ commentId: z.string().min(1) });

// GET /api/tree/[treeId]/comments/[memberId] — threaded comments with reactions
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const member = await prisma.familyMember.findFirst({
      where: { id: params.memberId, treeId: params.treeId },
    });
    if (!member) return apiError(404, "ممبر نہیں ملا");

    const comments = await prisma.memberComment.findMany({
      where: { memberId: params.memberId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, image: true } },
        reactions: true,
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
            reactions: true,
          },
        },
      },
    });

    return apiSuccess({
      items: comments.map((c) => ({
        id: c.id,
        memberId: c.memberId,
        userId: c.userId,
        parentId: c.parentId,
        content: c.content,
        isPinned: c.isPinned,
        isEdited: c.isEdited,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        user: c.user,
        reactions: c.reactions.map((r) => ({
          id: r.id,
          commentId: r.commentId,
          userId: r.userId,
          emoji: r.emoji,
          createdAt: r.createdAt.toISOString(),
        })),
        replies: c.replies.map((r) => ({
          id: r.id,
          memberId: r.memberId,
          userId: r.userId,
          parentId: r.parentId,
          content: r.content,
          isPinned: r.isPinned,
          isEdited: r.isEdited,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          user: r.user,
          reactions: r.reactions.map((x) => ({
            id: x.id,
            commentId: x.commentId,
            userId: x.userId,
            emoji: x.emoji,
            createdAt: x.createdAt.toISOString(),
          })),
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/comments/[memberId] — add comment or reply
export async function POST(req: NextRequest, { params }: RouteCtx) {
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

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = commentCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { content, parentId } = parsed.data;

    if (parentId) {
      const parent = await prisma.memberComment.findFirst({
        where: { id: parentId, memberId: params.memberId },
      });
      if (!parent) return apiError(404, "اصل کمنٹ نہیں ملا");
    }

    const comment = await prisma.memberComment.create({
      data: {
        memberId: params.memberId,
        userId: user.id,
        parentId: parentId ?? null,
        content: sanitizeInput(content),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        reactions: true,
      },
    });

    return apiSuccess(
      {
        message: parentId ? "جواب شامل ہو گیا" : "کمنٹ شامل ہو گیا",
        comment: {
          id: comment.id,
          memberId: comment.memberId,
          userId: comment.userId,
          parentId: comment.parentId,
          content: comment.content,
          isPinned: comment.isPinned,
          isEdited: comment.isEdited,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          user: comment.user,
          reactions: [],
          replies: [],
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/tree/[treeId]/comments/[memberId] — edit own comment (body: {commentId, content})
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
    const parsed = editBodySchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const comment = await prisma.memberComment.findFirst({
      where: { id: parsed.data.commentId, memberId: params.memberId },
    });
    if (!comment) return apiError(404, "کمنٹ نہیں ملا");
    if (comment.userId !== user.id && !access.canManageRoles) {
      return apiError(403, "صرف اپنا کمنٹ ایڈٹ کر سکتے ہیں");
    }

    const updated = await prisma.memberComment.update({
      where: { id: comment.id },
      data: { content: sanitizeInput(parsed.data.content), isEdited: true },
    });

    return apiSuccess({ message: "کمنٹ اپ ڈیٹ ہو گیا", content: updated.content, isEdited: updated.isEdited });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId]/comments/[memberId] — delete comment (body: {commentId})
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => ({}));
    const parsed = deleteBodySchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const comment = await prisma.memberComment.findFirst({
      where: { id: parsed.data.commentId, memberId: params.memberId },
    });
    if (!comment) return apiError(404, "کمنٹ نہیں ملا");
    if (comment.userId !== user.id && !access.canManageRoles) {
      return apiError(403, "صرف اپنا کمنٹ ڈیلیٹ کر سکتے ہیں");
    }

    await prisma.memberComment.delete({ where: { id: comment.id } });
    return apiSuccess({ message: "کمنٹ ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
