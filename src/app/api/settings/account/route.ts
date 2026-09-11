import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";

export async function DELETE(_req: NextRequest) {
  try {
    const user = await requireUser();
    await prisma.user.delete({ where: { id: user.id } });
    return apiSuccess({ message: "اکاؤنٹ ڈیلیٹ ہو گیا" });
  } catch (error) {
    return handleApiError(error);
  }
}
