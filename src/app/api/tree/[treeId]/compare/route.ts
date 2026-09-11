import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { memberCompareSchema } from "@/lib/tree-validators";
import { resolveTreeAccess } from "@/lib/tree-access";

type RouteCtx = { params: { treeId: string } };

// POST /api/tree/[treeId]/compare — compare 2 members side-by-side
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireUser();
    const resolved = await resolveTreeAccess(params.treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);

    const body = await req.json().catch(() => null);
    if (!body) return apiError(400, "غلط درخواست");
    const parsed = memberCompareSchema.safeParse(body);
    if (!parsed.success) return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    const { member1Id, member2Id } = parsed.data;

    const [m1, m2] = await Promise.all([
      prisma.familyMember.findFirst({ where: { id: member1Id, treeId: params.treeId } }),
      prisma.familyMember.findFirst({ where: { id: member2Id, treeId: params.treeId } }),
    ]);
    if (!m1 || !m2) return apiError(404, "ممبر نہیں ملا");

    const fields = [
      { key: "firstName", label: "پہلا نام" },
      { key: "lastName", label: "خاندانی نام" },
      { key: "nickName", label: "عرفیت" },
      { key: "gender", label: "جنس" },
      { key: "dateOfBirth", label: "تاریخ پیدائش" },
      { key: "dateOfDeath", label: "تاریخ وفات" },
      { key: "isAlive", label: "زندہ" },
      { key: "birthPlace", label: "جائے پیدائش" },
      { key: "deathPlace", label: "جائے وفات" },
      { key: "currentCity", label: "شہر" },
      { key: "occupation", label: "پیشہ" },
      { key: "education", label: "تعلیم" },
      { key: "bio", label: "تعارف" },
      { key: "phone", label: "فون" },
      { key: "email", label: "ای میل" },
    ] as const;

    const rows = fields.map((f) => {
      const a = m1[f.key];
      const b = m2[f.key];
      const fmt = (v: unknown) => {
        if (v === null || v === undefined || v === "") return null;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        if (typeof v === "boolean") return v ? "جی ہاں" : "نہیں";
        return String(v);
      };
      const av = fmt(a);
      const bv = fmt(b);
      return {
        key: f.key,
        label: f.label,
        value1: av,
        value2: bv,
        same: av !== null && av === bv,
      };
    });

    const sameCount = rows.filter((r) => r.same).length;
    const comparable = rows.filter((r) => r.value1 !== null || r.value2 !== null).length;

    return apiSuccess({
      member1: {
        id: m1.id,
        name: `${m1.firstName} ${m1.lastName}`.trim(),
        photo: m1.photo,
        dateOfBirth: m1.dateOfBirth?.toISOString() ?? null,
      },
      member2: {
        id: m2.id,
        name: `${m2.firstName} ${m2.lastName}`.trim(),
        photo: m2.photo,
        dateOfBirth: m2.dateOfBirth?.toISOString() ?? null,
      },
      rows,
      similarity: comparable > 0 ? Math.round((sameCount / comparable) * 100) : 0,
      sameCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
