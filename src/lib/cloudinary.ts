// Cloudinary integration for media uploads.
// If no Cloudinary credentials are configured, falls back to local
// storage under /public/uploads so the app works in any environment.

import { v2 as cloudinary } from "cloudinary";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZES } from "@/lib/constants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function detectMediaType(mimeType: string): "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) return "IMAGE";
  if (ALLOWED_MIME_TYPES.video.includes(mimeType)) return "VIDEO";
  if (ALLOWED_MIME_TYPES.audio.includes(mimeType)) return "AUDIO";
  return "DOCUMENT";
}

export function validateUpload(file: { type: string; size: number }): { ok: boolean; error?: string } {
  const type = detectMediaType(file.type);
  if (!ALLOWED_MIME_TYPES[type.toLowerCase() as keyof typeof ALLOWED_MIME_TYPES].includes(file.type)) {
    return { ok: false, error: "یہ فائل کی قسم اجازت یافتہ نہیں ہے" };
  }
  const maxSize = MAX_UPLOAD_SIZES[type.toLowerCase() as keyof typeof MAX_UPLOAD_SIZES];
  if (file.size > maxSize) {
    return { ok: false, error: `فائل سائز ${Math.round(maxSize / 1024 / 1024)}MB سے زیادہ نہیں ہو سکتی` };
  }
  return { ok: true };
}

export async function uploadToCloudinary(
  base64: string,
  options: { folder?: string; resourceType?: "image" | "video" | "raw" } = {}
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }
  const result = await cloudinary.uploader.upload(base64, {
    folder: options.folder || "digital-khandaan",
    resource_type: options.resourceType || "image",
  });
  return { url: result.url, publicId: result.public_id, secureUrl: result.secure_url };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best effort cleanup
  }
}
