import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "پاس ورڈ کم از کم 8 حروف کا ہو")
    .regex(/[a-zA-Z]/, "پاس ورڈ میں ایک انگریزی حرف ضروری ہے")
    .regex(/[0-9]/, "پاس ورڈ میں ایک نمبر ضروری ہے"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { token, password } = parsed.data;

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { token, identifier: { startsWith: "password-reset:" } },
    });

    if (!tokenRecord || tokenRecord.expires < new Date()) {
      return apiError(400, "ری سیٹ لنک کی مدت ختم ہو گئی ہے یا لنک غلط ہے");
    }

    const userId = tokenRecord.identifier.replace("password-reset:", "");
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return apiSuccess({ message: "پاس ورڈ بدل گیا! اب لاگ اِن کریں۔" });
  } catch (error) {
    return handleApiError(error);
  }
}
