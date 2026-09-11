import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, getIp } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { name, email, phone, password, gender, city } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError(400, "یہ ای میل پہلے سے رجسٹرڈ ہے");
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return apiError(400, "یہ فون نمبر پہلے سے رجسٹرڈ ہے");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: sanitizeInput(name),
        email,
        phone: phone || null,
        password: hashedPassword,
        gender: (gender as "MALE" | "FEMALE" | "OTHER") || null,
        city: city || null,
      },
      select: { id: true, name: true, email: true },
    });

    // Send welcome email (fire and forget)
    sendWelcomeEmail(email, name).catch(() => {});

    console.log(`[REGISTER] New user: ${email} (${getIp(req.headers)})`);
    return apiSuccess({ message: "اکاؤنٹ بن گیا! لاگ اِن کریں۔", user }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
