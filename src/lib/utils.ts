import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, differenceInCalendarDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function formatDate(date: Date | string | null | undefined, pattern = "dd MMM yyyy") {
  if (!date) return "—";
  return format(new Date(date), pattern);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, h:mm a");
}

export function relativeTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function relativeTimeEn(date: Date | string | null | undefined) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function initials(name: string | null | undefined) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === "function") {
    const array = new Uint8Array(length);
    cryptoObj.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "bg-gray-200" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const result =
    score === 0
      ? { label: "Weak", labelUrdu: "کمزور", color: "bg-red-500" }
      : score === 1
        ? { label: "Medium", labelUrdu: "درمیانہ", color: "bg-yellow-500" }
        : score === 2
          ? { label: "Strong", labelUrdu: "مضبوط", color: "bg-green-500" }
          : { label: "Very Strong", labelUrdu: "بہت مضبوط", color: "bg-emerald-600" };
  return { score: score as 0 | 1 | 2 | 3, label: result.label, color: result.color };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function daysUntil(date: Date | string): number {
  return differenceInCalendarDays(new Date(date), new Date());
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export function isSameDayMonth(date: Date | string, month: number, day: number): boolean {
  const d = new Date(date);
  return d.getMonth() === month && d.getDate() === day;
}

// ============================================================
// SEO/PERF: force Cloudinary to serve WebP (auto format/quality)
// for Cloudinary-hosted images; pass other URLs through unchanged.
// ============================================================
export function optimizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && !url.includes("f_auto")) {
    const idx = url.indexOf("/upload/");
    if (idx !== -1) {
      return url.slice(0, idx + 8) + "f_auto,q_auto/" + url.slice(idx + 8);
    }
  }
  return url;
}
