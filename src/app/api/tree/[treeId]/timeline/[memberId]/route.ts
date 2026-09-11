import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { lifeEventCreateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { sanitizeInput } from "@/lib/utils";

type RouteCtx = { params: { treeId: string; memberId: string } };

// GET /api/tree/[treeId]/timeline/[memberId] — life events (newest first)
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const member = await prisma.familyMember.findFirst({
      where: { id: params.memberId, treeId: params.treeId },
    });
    if (!member) return apiError(404, "ممبر نہیں ملا");

    const events = await prisma.memberLifeEvent.findMany({
      where: { memberId: params.memberId },
      orderBy: { date: "desc" },
    });

    return apiSuccess({
      items: events.map((e) => ({
        id: e.id,
        memberId: e.memberId,
        type: e.type,
        title: e.title,
        description: e.description,
        date: e.date.toISOString(),
        location: e.location,
        photo: e.photo,
        source: e.source,
        verifiedBy: e.verifiedBy,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/timeline/[memberId] — add life event
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
    const parsed = lifeEventCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { type, title, description, date, location, photo, source } = parsed.data;

    const event = await prisma.memberLifeEvent.create({
      data: {
        memberId: params.memberId,
        type,
        title: sanitizeInput(title),
        description: description ? sanitizeInput(description) : null,
        date,
        location,
        photo,
        source,
      },
    });

    await logTreeAccess(params.treeId, user.id, "ADD_LIFE_EVENT", req);

    return apiSuccess(
      {
        message: "زندگی کا واقعہ شامل ہو گیا",
        event: { ...event, date: event.date.toISOString(), createdAt: event.createdAt.toISOString(), updatedAt: event.updatedAt.toISOString() },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
