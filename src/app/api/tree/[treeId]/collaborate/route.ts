import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { collaboratorAddSchema, collaboratorUpdateSchema } from "@/lib/tree-validators";
import { logTreeAccess, resolveTreeAccess } from "@/lib/tree-access";
import { z } from "zod";

type RouteCtx = { params: { treeId: string } };

const removeSchema = z.object({ collaboratorId: z.string().min(1) });

// GET /api/tree/[treeId]/collaborate — list collaborators
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const collabs = await prisma.treeCollaborator.findMany({
      where: { treeId: params.treeId },
      orderBy: { addedAt: "asc" },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: collabs.map((c) => c.userId) } },
      select: { id: true, name: true, email: true, image: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return apiSuccess({
      items: collabs.map((c) => ({
        id: c.id,
        treeId: c.treeId,
        userId: c.userId,
        role: c.role,
        canEditBranch: c.canEditBranch,
        addedAt: c.addedAt.toISOString(),
        user: userById.get(c.userId) ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/collaborate — add collaborator by email (VIEWER/EDITOR/ADMIN)
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    if (!access.canManageRoles) return apiError(403, "صرف مالک یا ایڈمن ہی ساتھی بنا سکتے ہیں");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = collaboratorAddSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { email, role, canEditBranch } = parsed.data;

    const target = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!target) return apiError(404, "اس ای میل سے کوئی صارف نہیں ملا");
    if (target.id === access.tree.creatorId) return apiError(400, "مالک خود ساتھی نہیں بن سکتا");

    const existing = await prisma.treeCollaborator.findUnique({
      where: { treeId_userId: { treeId: params.treeId, userId: target.id } },
    });
    if (existing) return apiError(400, "یہ صارف پہلے ہی ساتھی ہے");

    const collab = await prisma.treeCollaborator.create({
      data: {
        treeId: params.treeId,
        userId: target.id,
        role,
        canEditBranch: canEditBranch ?? null,
        addedById: user.id,
      },
    });

    await logTreeAccess(params.treeId, user.id, "COLLABORATOR_ADDED", req);

    return apiSuccess(
      {
        message: "ساتھی شامل ہو گیا",
        collaborator: {
          id: collab.id,
          treeId: collab.treeId,
          userId: collab.userId,
          role: collab.role,
          canEditBranch: collab.canEditBranch,
          addedAt: collab.addedAt.toISOString(),
          user: { id: target.id, name: target.name, email: target.email, image: target.image },
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/tree/[treeId]/collaborate — update collaborator role (body: {collaboratorId, role})
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    if (!access.canManageRoles) return apiError(403, "صرف مالک یا ایڈمن ہی رول بدل سکتے ہیں");

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = collaboratorUpdateSchema.extend({ collaboratorId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { collaboratorId, role, canEditBranch } = parsed.data;

    const collab = await prisma.treeCollaborator.findFirst({
      where: { id: collaboratorId, treeId: params.treeId },
    });
    if (!collab) return apiError(404, "ساتھی نہیں ملا");
    if (collab.userId === access.tree.creatorId) return apiError(400, "مالک کا رول نہیں بدل سکتا");

    const updated = await prisma.treeCollaborator.update({
      where: { id: collab.id },
      data: {
        ...(role ? { role } : {}),
        ...(canEditBranch !== undefined ? { canEditBranch } : {}),
      },
    });

    await logTreeAccess(params.treeId, user.id, "COLLABORATOR_UPDATED", req);

    return apiSuccess({ message: "ساتھی کا رول بدل دیا گیا", role: updated.role, canEditBranch: updated.canEditBranch });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/tree/[treeId]/collaborate — remove collaborator (body: {collaboratorId})
export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    if (!access.canManageRoles) return apiError(403, "صرف مالک یا ایڈمن ہی ساتھی ہٹا سکتے ہیں");

    const body = await req.json().catch(() => ({}));
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);

    const collab = await prisma.treeCollaborator.findFirst({
      where: { id: parsed.data.collaboratorId, treeId: params.treeId },
    });
    if (!collab) return apiError(404, "ساتھی نہیں ملا");

    await prisma.treeCollaborator.delete({ where: { id: collab.id } });
    await logTreeAccess(params.treeId, user.id, "COLLABORATOR_REMOVED", req);

    return apiSuccess({ message: "ساتھی ہٹا دیا گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
