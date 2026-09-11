import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validators";
import { apiError, apiSuccess, handleApiError } from "@/lib/api";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, "ValidationError", parsed.error.flatten().fieldErrors);
    }

    const { name, email, subject, message } = parsed.data;

    await prisma.contactMessage.create({
      data: {
        name: sanitizeInput(name),
        email,
        subject: sanitizeInput(subject),
        message: sanitizeInput(message),
      },
    });

    return apiSuccess({ message: "Message bhej diya gaya! Hum jald raabta karein gay." }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
