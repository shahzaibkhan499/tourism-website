import type { Metadata } from "next";
import Link from "next/link";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 — صفحہ نہیں ملا | Digital Family Tree",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
        <TreePine className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-6xl font-extrabold text-gray-900">404</h1>
      <h2 className="mt-2 text-2xl font-semibold">یہ صفحہ نہیں ملا</h2>
      <p className="mt-3 max-w-md text-gray-600">
        جو صفحہ آپ ڈھونڈ رہے ہیں وہ موجود نہیں ہے یا ہٹا دیا گیا ہے۔
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Wapis Home Par</Link>
      </Button>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Link href="/login" className="text-emerald-600 underline-offset-4 hover:underline">لاگ ان کریں</Link>
        <span className="text-gray-300">•</span>
        <Link href="/register" className="text-emerald-600 underline-offset-4 hover:underline">اکاؤنٹ بنائیں</Link>
        <span className="text-gray-300">•</span>
        <Link href="/events" className="text-emerald-600 underline-offset-4 hover:underline">ایونٹس</Link>
        <span className="text-gray-300">•</span>
        <Link href="/tree" className="text-emerald-600 underline-offset-4 hover:underline">شجرہ نسب</Link>
      </div>
    </div>
  );
}
