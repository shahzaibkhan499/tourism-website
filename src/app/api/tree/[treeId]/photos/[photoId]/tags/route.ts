import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { assertCanEdit, resolveTreeAccess } from "@/lib/tree-access";
import { z } from "zod";

type RouteCtx = { params: { treeId: string; photoId: string } };

const tagSchema = z.object({
  memberId: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

// POST /api/tree/[treeId]/photos/[photoId]/tags — face tag a member
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const photo = await prisma.groupPhoto.findFirst({
      where: { id: params.photoId, treeId: params.treeId },
    });
    if (!photo) return apiError(404, "تصویر نہیں ملی");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { memberId, x, y } = parsed.data;

    const member = await prisma.familyMember.findFirst({
      where: { id: memberId, treeId: params.treeId },
    });
    if (!member) return apiError(404, "ممبر نہیں ملا");

    const existing = await prisma.groupPhotoTag.findUnique({
      where: { photoId_memberId: { photoId: params.photoId, memberId } },
    });
    const tag = existing
      ? await prisma.groupPhotoTag.update({ where: { id: existing.id }, data: { x, y } })
      : await prisma.groupPhotoTag.create({
          data: { photoId: params.photoId, memberId, x, y },
        });

    return apiSuccess({ message: "ٹیگ محفوظ ہو گیا", tag }, existing ? 200 : 201);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId]/photos/[photoId]/tags — remove tag (body: {memberId})
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => ({}));
    const parsed = z.object({ memberId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const tag = await prisma.groupPhotoTag.findUnique({
      where: { photoId_memberId: { photoId: params.photoId, memberId: parsed.data.memberId } },
    });
    if (!tag) return apiError(404, "ٹیگ نہیں ملا");

    await prisma.groupPhotoTag.delete({ where: { id: tag.id } });
    return apiSuccess({ message: "ٹیگ ہٹا دیا گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
