import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, auditLog, handleApiError, requireUser } from "@/lib/api";
import { sendEmail, emailTemplate } from "@/lib/email";
import { getClientIp } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const PHONE_REGEX = /^03\d{9}$/;

function generateOtp(): string {
  const bytes = new Uint8Array(3);
  globalThis.crypto.getRandomValues(bytes);
  const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 1000000;
  return String(num).padStart(6, "0");
}

// Step 1: request a 6-digit OTP for an email or phone change.
// OTP is stored in VerificationToken (expires in 10 minutes) and delivered
// via email (SMTP). When SMTP is not configured (local development) the code
// is returned as devOtp so the flow can still be tested end-to-end.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const parsed = z
      .object({
        type: z.enum(["email", "phone"]),
        value: z.string().min(1).max(100),
      })
      .safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { type, value } = parsed.data;

    if (type === "email") {
      const email = z.string().email("درست ای میل لکھیں").safeParse(value);
      if (!email.success) return apiError(400, "درست ای میل لکھیں");
      const taken = await prisma.user.findUnique({ where: { email: email.data } });
      if (taken) return apiError(409, "یہ ای میل پہلے سے رجسٹرڈ ہے");
    } else {
      if (!PHONE_REGEX.test(value)) {
        return apiError(400, "درست پاکستانی موبائل نمبر لکھیں (03001234567)");
      }
      const taken = await prisma.user.findFirst({ where: { phone: value } });
      if (taken) return apiError(409, "یہ فون نمبر پہلے سے رجسٹرڈ ہے");
    }

    const otp = generateOtp();
    const identifier = `${type}-change:${user.id}`;
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate previous OTPs for this change type
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({
      data: { identifier, token: otp, expires },
    });

    // Deliver the OTP: for a phone change we send it to the registered email
    // (no SMS gateway in the configured stack).
    const deliveryTarget = type === "email" ? value : user.email;
    if (deliveryTarget) {
      const { ok, info } = await sendEmail({
        to: deliveryTarget,
        subject: `${APP_NAME} — ${type === "email" ? "Email" : "Phone"} change OTP`,
        html: emailTemplate(`
          <h2 style="color:#065f46;">Aapka OTP code</h2>
          <p style="font-size:15px;color:#374151;">Aapne apna ${
            type === "email" ? "email address" : "phone number"
          } badalne ki request ki hai. Verification code yeh hai:</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#059669;padding:18px 0;text-align:center;">${otp}</div>
          <p style="font-size:13px;color:#6b7280;">Yeh code 10 minute mein expire ho jayega. Agar yeh request aapne nahi ki, to is email ko ignore kar dein.</p>
        `),
      });
      if (!ok) return apiError(502, "ای میل بھیجنے میں مسئلہ آ گیا۔ دوبارہ کوشش کریں۔");

      await auditLog(user.id, type === "email" ? "EMAIL_CHANGE_OTP" : "PHONE_CHANGE_OTP", "User", user.id, undefined, getClientIp(req.headers));

      return apiSuccess({ message: "OTP بھیج دیا گیا ہے", devOtp: info === "logged" ? otp : undefined });
    }

    return apiError(400, "آپ کے اکاؤنٹ پر کوئی ای میل رجسٹرڈ نہیں ہے");
  } catch (error) {
    return handleApiError(error);
  }
}
