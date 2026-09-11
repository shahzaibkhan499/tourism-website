import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { sanitizeInput } from "@/lib/utils";
import { z } from "zod";

type RouteCtx = { params: { treeId: string } };

const MAX_PHOTO = 8 * 1024 * 1024; // 8MB

// GET /api/tree/[treeId]/photos — group photos with tags
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const photos = await prisma.groupPhoto.findMany({
      where: { treeId: params.treeId },
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true, photo: true } },
          },
        },
      },
    });

    return apiSuccess({
      items: photos.map((p) => ({
        id: p.id,
        treeId: p.treeId,
        url: p.url,
        publicId: p.publicId,
        caption: p.caption,
        date: p.date?.toISOString() ?? null,
        location: p.location,
        eventId: p.eventId,
        uploadedBy: p.uploadedBy,
        createdAt: p.createdAt.toISOString(),
        tags: p.tags.map((t) => ({
          id: t.id,
          photoId: t.photoId,
          memberId: t.memberId,
          x: t.x,
          y: t.y,
          member: t.member,
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/photos — upload group photo (multipart file or base64 field)
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const form = await req.formData().catch(() => null);
    if (!form) return apiError(400, "غلط درخواست");

    const captionRaw = String(form.get("caption") ?? "");
    const dateRaw = String(form.get("date") ?? "");
    const locationRaw = String(form.get("location") ?? "");
    const eventIdRaw = String(form.get("eventId") ?? "");
    const file = form.get("file");
    const base64Raw = form.get("base64");

    let uploadResult: { url: string; publicId: string };
    if (file && file instanceof File) {
      if (!file.type.startsWith("image/")) return apiError(400, "صرف تصویر اپ لوڈ ہو سکتی ہے");
      if (file.size > MAX_PHOTO) return apiError(400, "تصویر 8MB سے بڑی نہیں ہو سکتی");
      const buf = Buffer.from(await file.arrayBuffer());
      uploadResult = await uploadToCloudinary(`data:${file.type};base64,${buf.toString("base64")}`, {
        folder: "digital-khandaan/tree-photos",
      });
    } else if (base64Raw && String(base64Raw).length > 100) {
      uploadResult = await uploadToCloudinary(String(base64Raw), {
        folder: "digital-khandaan/tree-photos",
      });
    } else {
      return apiError(400, "تصویر منتخب کریں");
    }

    const photo = await prisma.groupPhoto.create({
      data: {
        treeId: params.treeId,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        caption: captionRaw ? sanitizeInput(captionRaw) : null,
        date: dateRaw ? new Date(dateRaw) : null,
        location: locationRaw ? sanitizeInput(locationRaw) : null,
        eventId: eventIdRaw || null,
        uploadedBy: user.id,
      },
      include: { tags: true },
    });

    await logTreeAccess(params.treeId, user.id, "PHOTO_UPLOADED", req);

    return apiSuccess(
      {
        message: "گروپ تصویر محفوظ ہو گئی",
        photo: {
          id: photo.id,
          treeId: photo.treeId,
          url: photo.url,
          caption: photo.caption,
          date: photo.date?.toISOString() ?? null,
          location: photo.location,
          createdAt: photo.createdAt.toISOString(),
          tags: [],
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId]/photos — remove photo (body: {photoId})
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const body = await req.json().catch(() => ({}));
    const parsed = z.object({ photoId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const photo = await prisma.groupPhoto.findFirst({
      where: { id: parsed.data.photoId, treeId: params.treeId },
    });
    if (!photo) return apiError(404, "تصویر نہیں ملی");

    await prisma.groupPhoto.delete({ where: { id: photo.id } });
    return apiSuccess({ message: "تصویر ڈیلیٹ ہو گئی" });
  } catch (error) {
    return handleApiError(error);
  }
}
