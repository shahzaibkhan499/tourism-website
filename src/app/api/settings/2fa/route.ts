import { NextRequest } from "next/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { generateToken } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const enableSchema = z.object({
  code: z.string().length(6, "6 ہندسوں کا کوڈ لکھیں"),
  password: z.string().min(1, "پاس ورڈ لکھیں"),
});
const disableSchema = z.object({
  code: z.string().length(6, "6 ہندسوں کا کوڈ لکھیں"),
  password: z.string().min(1, "پاس ورڈ لکھیں"),
});
const verifyLoginSchema = z.object({
  code: z.string().min(1, "کوڈ لکھیں"),
});

// GET: generate 2FA secret + QR code (setup step 1)
export async function GET() {
  try {
    const user = await requireUser();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { twoFactorEnabled: true } });
    if (dbUser?.twoFactorEnabled) {
      return apiError(400, "2FA پہلے سے فعال ہے");
    }

    const secret = speakeasy.generateSecret({
      name: APP_NAME,
      length: 20,
    });
    const otpauthUrl = secret.otpauth_url || "";
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return apiSuccess({
      secret: secret.base32,
      otpauthUrl,
      qrDataUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: enable 2FA (setup step 2 — verify code)
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = enableSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { code, password, secret: providedSecret } = body as { code: string; password: string; secret: string };

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.password) throw new Error("UNAUTHORIZED");

    const passwordValid = await bcrypt.compare(password, dbUser.password);
    if (!passwordValid) return apiError(400, "پاس ورڈ غلط ہے");

    const verified = speakeasy.totp.verify({
      secret: providedSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!verified) return apiError(400, "کوڈ غلط ہے۔ دوبارہ کوشش کریں");

    const backupCodes = Array.from({ length: 10 }, () => generateToken(8));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: providedSecret,
      },
    });

    return apiSuccess({ backupCodes, message: "2FA فعال ہو گیا!" });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: verify 2FA code (used during login flow)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = verifyLoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
      return apiError(400, "2FA فعال نہیں ہے");
    }

    const verified = speakeasy.totp.verify({
      secret: dbUser.twoFactorSecret,
      encoding: "base32",
      token: parsed.data.code,
      window: 1,
    });
    if (!verified) return apiError(400, "کوڈ غلط ہے");

    return apiSuccess({ verified: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: disable 2FA (requires password + code)
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = disableSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.password || !dbUser.twoFactorSecret) throw new Error("UNAUTHORIZED");

    const passwordValid = await bcrypt.compare(parsed.data.password, dbUser.password);
    if (!passwordValid) return apiError(400, "پاس ورڈ غلط ہے");

    const verified = speakeasy.totp.verify({
      secret: dbUser.twoFactorSecret,
      encoding: "base32",
      token: parsed.data.code,
      window: 1,
    });
    if (!verified) return apiError(400, "2FA کوڈ غلط ہے");

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return apiSuccess({ message: "2FA غیر فعال ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
