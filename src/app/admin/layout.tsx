import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: `Admin Panel | ${APP_NAME}`,
  description: "ایڈمن پینل — پلیٹ فارم کا انتظامی کنٹرول سینٹر",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    // TEST 10: non-admin accessing /admin gets an explicit 403 page
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">403 — رسائی ممنوع</h1>
          <p className="mt-2 text-sm text-gray-600">
            یہ صفحہ صرف ایڈمن کے لیے ہے۔ آپ کو اجازت نہیں ہے۔
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            ڈیش بورڈ پر واپس جائیں
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div dir="auto" className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
