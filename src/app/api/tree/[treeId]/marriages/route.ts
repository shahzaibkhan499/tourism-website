import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { marriageCreateSchema } from "@/lib/tree-validators";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// POST /api/tree/[treeId]/marriages — add marriage (supports multiple marriages per person)
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
    const parsed = marriageCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { spouse1Id, spouse2Id, date, endDate, location, status, type, sortOrder } = parsed.data;

    if (spouse1Id === spouse2Id) return apiError(400, "دونوں شریک حیات ایک ہی نہیں ہو سکتے");

    const [s1, s2] = await Promise.all([
      prisma.familyMember.findFirst({ where: { id: spouse1Id, treeId: params.treeId } }),
      prisma.familyMember.findFirst({ where: { id: spouse2Id, treeId: params.treeId } }),
    ]);
    if (!s1 || !s2) return apiError(404, "ممبر نہیں ملا");
    if (s1.gender === s2.gender) {
      return apiError(400, "شادی کے لیے ایک مرد اور ایک خاتون چاہئیں");
    }

    const existing = await prisma.marriage.findUnique({
      where: { spouse1Id_spouse2Id: { spouse1Id, spouse2Id } },
    });
    if (existing) return apiError(400, "یہ شادی پہلے سے درج ہے");

    const nextOrder = await prisma.marriage.count({
      where: { treeId: params.treeId, OR: [{ spouse1Id }, { spouse2Id }] },
    });

    const snapshot = await snapshotTree(params.treeId);

    const marriage = await prisma.marriage.create({
      data: {
        treeId: params.treeId,
        spouse1Id,
        spouse2Id,
        date: date ?? null,
        endDate: endDate ?? null,
        location,
        status: status ?? "MARRIED",
        type: type ?? "NIKKAH",
        sortOrder: sortOrder ?? nextOrder,
      },
    });

    await recordVersion(params.treeId, user.id, "MARRIAGE_ADD", snapshot, {
      marriageId: marriage.id,
      spouse1Id,
      spouse2Id,
      status: marriage.status,
    });
    await refreshTreeStats(params.treeId);
    await logTreeAccess(params.treeId, user.id, "ADD_MARRIAGE", req);

    return apiSuccess({ message: "شادی درج ہو گئی", marriage }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
