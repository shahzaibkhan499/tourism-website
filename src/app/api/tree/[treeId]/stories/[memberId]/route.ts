import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { storyCreateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string; memberId: string } };

// GET /api/tree/[treeId]/stories/[memberId] — member stories
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const member = await prisma.familyMember.findFirst({
      where: { id: params.memberId, treeId: params.treeId },
    });
    if (!member) return apiError(404, "ممبر نہیں ملا");

    const stories = await prisma.memberStory.findMany({
      where: { memberId: params.memberId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    return apiSuccess({
      items: stories.map((s) => ({
        id: s.id,
        memberId: s.memberId,
        userId: s.userId,
        title: s.title,
        content: s.content,
        language: s.language,
        isPublic: s.isPublic,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        author: s.author,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/stories/[memberId] — add story
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
    const parsed = storyCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { title, content, language, isPublic } = parsed.data;

    const story = await prisma.memberStory.create({
      data: {
        memberId: params.memberId,
        userId: user.id,
        title: sanitizeInput(title),
        content: sanitizeInput(content),
        language: language ?? "ur",
        isPublic: isPublic ?? true,
      },
      include: { author: { select: { id: true, name: true, image: true } } },
    });

    await logTreeAccess(params.treeId, user.id, "ADD_STORY", req);

    return apiSuccess(
      {
        message: "کہانی محفوظ ہو گئی",
        story: {
          id: story.id,
          memberId: story.memberId,
          userId: story.userId,
          title: story.title,
          content: story.content,
          language: story.language,
          isPublic: story.isPublic,
          createdAt: story.createdAt.toISOString(),
          updatedAt: story.updatedAt.toISOString(),
          author: story.author,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
