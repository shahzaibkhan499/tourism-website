import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { relationshipCreateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// POST /api/tree/[treeId]/relationships — add parent-child relationship
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
    const parsed = relationshipCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { parentId, childId, type } = parsed.data;

    if (parentId === childId) return apiError(400, "والدین اور بچہ ایک ہی نہیں ہو سکتے");

    const [parent, child] = await Promise.all([
      prisma.familyMember.findFirst({ where: { id: parentId, treeId: params.treeId } }),
      prisma.familyMember.findFirst({ where: { id: childId, treeId: params.treeId } }),
    ]);
    if (!parent || !child) return apiError(404, "ممبر نہیں ملا");

    // a child can have max 2 parents (father + mother)
    const existingParents = await prisma.relationship.findMany({ where: { childId } });
    if (existingParents.some((r) => r.parentId === parentId)) {
      return apiError(400, "یہ رشتہ پہلے سے موجود ہے");
    }
    if (existingParents.length >= 2) {
      return apiError(400, "ایک بچے کے زیادہ سے زیادہ 2 والدین ہو سکتے ہیں");
    }

    // cycle guard: parent must not be a descendant of child
    {
      const visited = new Set<string>([childId]);
      let frontier = [childId];
      let cycle = false;
      while (frontier.length > 0 && !cycle) {
        const next: string[] = [];
        for (const id of frontier) {
          const children = await prisma.relationship.findMany({ where: { parentId: id } });
          for (const c of children) {
            if (c.childId === parentId) {
              cycle = true;
              break;
            }
            if (!visited.has(c.childId)) {
              visited.add(c.childId);
              next.push(c.childId);
            }
          }
          if (cycle) break;
        }
        frontier = next;
      }
      if (cycle) return apiError(400, "یہ رشتہ دائرہ (cycle) بنا دیتا ہے — والدین بچے کی اولاد نہیں ہو سکتے");
    }

    // child generation must be parent generation + 1 (or recompute)
    const childGeneration = Math.max(parent.generation + 1, child.generation);

    const snapshot = await snapshotTree(params.treeId);

    const rel = await prisma.$transaction(async (tx) => {
      const r = await tx.relationship.create({
        data: { treeId: params.treeId, parentId, childId, type: type ?? "BIOLOGICAL" },
      });
      await tx.familyMember.update({
        where: { id: childId },
        data: { generation: childGeneration },
      });
      return r;
    });

    await recordVersion(params.treeId, user.id, "RELATIONSHIP_ADD", snapshot, {
      relationshipId: rel.id,
      parentId,
      childId,
      type: rel.type,
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "ADD_RELATIONSHIP", req);

    return apiSuccess({ message: "رشتہ شامل ہو گیا", relationship: rel }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
