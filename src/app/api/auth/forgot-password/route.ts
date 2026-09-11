import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { generateToken } from "@/lib/utils";
import { sendResetPasswordEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (user) {
      const token = generateToken(48);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.verificationToken.create({
        data: { identifier: `password-reset:${user.id}`, token, expires },
      });

      await sendResetPasswordEmail(email, token);
    }

    return apiSuccess({ message: "Agar email mojood hai to reset link bhej diya gaya hai. Email check karein." });
  } catch (error) {
    return handleApiError(error);
  }
}
