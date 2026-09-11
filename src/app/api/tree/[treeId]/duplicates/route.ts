import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { assertCanEdit, resolveTreeAccess } from "@/lib/tree-access";
import { detectAllDuplicates } from "@/lib/duplicate-detection";

type RouteCtx = { params: { treeId: string } };

// GET /api/tree/[treeId]/duplicates — detect all duplicate pairs
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const user = await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const matches = await detectAllDuplicates(params.treeId);

    // persist pairs as DuplicateMatch rows (idempotent)
    const existing = await prisma.duplicateMatch.findMany({
      where: { treeId: params.treeId },
    });
    const existingKeys = new Set(existing.map((e) => `${e.member1Id}|${e.member2Id}`));
    for (const m of matches) {
      const key = `${m.member1.id}|${m.member2.id}`;
      if (!existingKeys.has(key)) {
        await prisma.duplicateMatch.create({
          data: {
            treeId: params.treeId,
            member1Id: m.member1.id,
            member2Id: m.member2.id,
            score: m.score,
            status: "PENDING",
          },
        });
        existingKeys.add(key);
      }
    }

    return apiSuccess({
      total: matches.length,
      blocked: matches.filter((r) => r.score >= 80).map((r) => `${r.member1.id}|${r.member2.id}`),
      items: matches.map((m) => ({
        member1: m.member1,
        member2: m.member2,
        score: m.score,
        severity: m.score >= 80 ? "HIGH" : "MEDIUM",
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tree/[treeId]/duplicates — mark CONFIRMED_SAME / CONFIRMED_DIFFERENT without merging
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
    const { member1Id, member2Id, decision } = body ?? {};
    if (!member1Id || !member2Id || !["CONFIRMED_SAME", "CONFIRMED_DIFFERENT"].includes(decision)) {
      return apiError(400, "member1Id، member2Id اور درست فیصلہ دیں");
    }

    const match = await prisma.duplicateMatch.findUnique({
      where: { member1Id_member2Id: { member1Id, member2Id } },
    });
    if (!match) return apiError(404, "ڈپلیکیٹ ریکارڈ نہیں ملا");

    const updated = await prisma.duplicateMatch.update({
      where: { id: match.id },
      data: {
        status: decision,
        resolvedBy: user.id,
        resolvedAt: new Date(),
      },
    });

    return apiSuccess({
      message: decision === "CONFIRMED_SAME" ? "ایک ہی شخص قرار دیا گیا" : "مختلف افراد قرار دیے گئے",
      status: updated.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
