import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, auditLog, handleApiError, requireUser } from "@/lib/api";
import { getClientIp } from "@/lib/utils";

const PHONE_REGEX = /^03\d{9}$/;

// Step 2: verify the OTP and apply the email/phone change
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = z
      .object({
        type: z.enum(["email", "phone"]),
        value: z.string().min(1).max(100),
        otp: z.string().length(6, "OTP 6 ہندسوں کا ہوتا ہے"),
      })
      .safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { type, value, otp } = parsed.data;

    if (type === "email") {
      const email = z.string().email("درست ای میل لکھیں").safeParse(value);
      if (!email.success) return apiError(400, "درست ای میل لکھیں");
      const taken = await prisma.user.findUnique({ where: { email: email.data } });
      if (taken) return apiError(409, "یہ ای میل پہلے سے رجسٹرڈ ہے");
    } else if (!PHONE_REGEX.test(value)) {
      return apiError(400, "درست پاکستانی موبائل نمبر لکھیں (03001234567)");
    }

    const identifier = `${type}-change:${user.id}`;
    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier, token: otp } },
    });

    if (!record) return apiError(400, "غلط OTP۔ دوبارہ چیک کریں");
    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier } });
      return apiError(400, "OTP کی مدت ختم ہو گئی ہے۔ نیا OTP لیں");
    }

    // Apply the change + consume the token atomically
    await prisma.$transaction([
      type === "email"
        ? prisma.user.update({ where: { id: user.id }, data: { email: value } })
        : prisma.user.update({ where: { id: user.id }, data: { phone: value } }),
      prisma.verificationToken.deleteMany({ where: { identifier } }),
    ]);

    await auditLog(
      user.id,
      type === "email" ? "EMAIL_CHANGED" : "PHONE_CHANGED",
      "User",
      user.id,
      undefined,
      getClientIp(req.headers)
    );

    return apiSuccess({
      message: type === "email" ? "ای میل بدل گیا!" : "فون نمبر بدل گیا!",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
