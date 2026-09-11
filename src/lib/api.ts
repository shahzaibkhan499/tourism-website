// ============================================================
// Digital Khandaan - API helpers
// Consistent error handling, auth guards, and pagination
// ============================================================

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export function apiError(status: number, error: string, details?: unknown) {
  return NextResponse.json({ error, details: details ?? undefined }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  const isExpected =
    error instanceof Error &&
    ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST", "RATE_LIMITED", "CLOUDINARY_NOT_CONFIGURED"].includes(error.message);
  if (!isExpected) console.error("[API ERROR]", error);
  if (error instanceof ZodError) {
    return apiError(400, "ValidationError", error.flatten().fieldErrors);
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (msg === "UNAUTHORIZED") return apiError(401, "لاگ اِن کرنا ضروری ہے");
    if (msg === "FORBIDDEN") return apiError(403, "آپ کو اس کارروائی کی اجازت نہیں ہے");
    if (msg === "NOT_FOUND") return apiError(404, "کوئی ڈیٹا نہیں ملا");
    if (msg === "BAD_REQUEST") return apiError(400, "غلط درخواست");
    if (msg === "RATE_LIMITED") return apiError(429, "بہت زیادہ کوششیں۔ تھوڑی دیر بعد دوبارہ کوشش کریں");
    return apiError(500, error.message);
  }
  return apiError(500, "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔");
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.isBanned) throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function requireModeratorOrAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "MODERATOR") throw new Error("FORBIDDEN");
  return user;
}

export async function auditLog(
  adminId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: { adminId, action, entity, entityId, details: (details ?? undefined) as never, ipAddress },
    });
  } catch (error) {
    console.error("[AUDIT LOG FAILED]", error);
  }
}

export function getIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
