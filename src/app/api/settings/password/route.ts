import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.password) {
      return apiError(400, "گوگل لاگ اِن والے صارفین کا پاس ورڈ نہیں ہوتا");
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
    if (!valid) {
      return apiError(400, "موجودہ پاس ورڈ غلط ہے");
    }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return apiSuccess({ message: "پاس ورڈ بدل گیا!" });
  } catch (error) {
    return handleApiError(error);
  }
}
