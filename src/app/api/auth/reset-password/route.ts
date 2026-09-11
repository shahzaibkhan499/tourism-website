import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password kam az kam 8 characters ka ho")
    .regex(/[a-zA-Z]/, "Password mein ek English harf zaroori hai")
    .regex(/[0-9]/, "Password mein ek number zaroori hai"),
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
      return apiError(400, "Reset link expire ho gaya hai ya ghalat hai");
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

    return apiSuccess({ message: "Password badal gaya! Ab login karein." });
  } catch (error) {
    return handleApiError(error);
  }
}
