import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { detectMediaType, validateUpload, uploadToCloudinary } from "@/lib/cloudinary";
import { generateToken } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError(400, "فائل منتخب کریں");
    }

    const validation = validateUpload({ type: file.type, size: file.size });
    if (!validation.ok) {
      return apiError(400, validation.error || "فائل درست نہیں ہے");
    }

    const type = detectMediaType(file.type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name).toLowerCase() || mimeToExtension(file.type);
    const safeName = `${generateToken(12)}-${Date.now()}${extension}`;

    let url: string;
    let publicId: string | null = null;

    // Try Cloudinary first, fall back to local storage
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      const result = await uploadToCloudinary(base64, {
        folder: `digital-khandaan/users/${user.id}`,
        resourceType: type === "IMAGE" ? "image" : type === "VIDEO" ? "video" : "raw",
      });
      url = result.secureUrl || result.url;
      publicId = result.publicId;
    } else {
      const uploadDir = path.join(process.cwd(), "public", "uploads", user.id);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeName);
      await writeFile(filePath, buffer);
      url = `/uploads/${user.id}/${safeName}`;
    }

    const media = await prisma.media.create({
      data: {
        url,
        publicId,
        type,
        size: file.size,
        mimeType: file.type,
        userId: user.id,
      },
    });

    return apiSuccess(media, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  };
  return map[mime] || ".bin";
}
