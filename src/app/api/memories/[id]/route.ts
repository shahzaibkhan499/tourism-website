import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { memorySchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const memory = await prisma.memory.findUnique({
      where: { id },
      include: {
        media: { orderBy: { createdAt: "asc" } },
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (!memory) throw new Error("NOT_FOUND");
    if (memory.userId !== user.id && !memory.isPublic) throw new Error("FORBIDDEN");

    return apiSuccess(memory);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new Error("NOT_FOUND");
    if (memory.userId !== user.id) throw new Error("FORBIDDEN");

    const body = await req.json();
    const parsed = memorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const d = parsed.data;
    const data: any = {};
    if (d.title !== undefined) data.title = sanitizeInput(d.title);
    if (d.description !== undefined) data.description = d.description;
    if (d.date !== undefined) data.date = d.date ? new Date(d.date) : null;
    if (d.location !== undefined) data.location = d.location;
    if (d.category !== undefined) data.category = d.category;
    if (d.isPublic !== undefined) data.isPublic = d.isPublic;

    const updated = await prisma.memory.update({ where: { id }, data, include: { media: true } });
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { id } = params;

    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new Error("NOT_FOUND");
    if (memory.userId !== user.id && user.role !== "ADMIN") throw new Error("FORBIDDEN");

    await prisma.memory.delete({ where: { id } });
    return apiSuccess({ message: "Memory delete ho gayi" });
  } catch (error) {
    return handleApiError(error);
  }
}
