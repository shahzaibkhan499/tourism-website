import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { getClientIp } from "@/lib/utils";
import { isRateLimited } from "@/lib/rate-limit";

// POST /api/auth/check
// Pre-flight credential check used by the login form so users get
// specific, human-friendly errors (Auth.js masks authorize errors
// as "Configuration", so the real reason never reaches the UI).
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    if (isRateLimited(`login-check:${ip}`)) {
      return apiError(429, "RateLimitExceeded", "بہت زیادہ کوششیں۔ 15 منٹ بعد دوبارہ کوشش کریں");
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "InvalidInput", "ای میل اور پاس ورڈ درست لکھیں");
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return apiError(401, "InvalidCredentials", "ای میل یا پاس ورڈ غلط ہے");
    }
    if (user.isBanned) {
      return apiError(403, "AccountBanned", "آپ کا اکاؤنٹ بند کر دیا گیا ہے");
    }
    if (!user.isActive) {
      return apiError(403, "AccountInactive", "آپ کا اکاؤنٹ غیر فعال ہے");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return apiError(401, "InvalidCredentials", "ای میل یا پاس ورڈ غلط ہے");
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
