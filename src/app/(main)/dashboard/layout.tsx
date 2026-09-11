import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Dashboard",
  titleUrdu: "ڈیش بورڈ",
  description: "آپ کی فیملی سرگرمیوں کا مرکز — ایونٹس، یادیں، کلان اور اطلاعات ایک جگہ",
  path: "/dashboard",
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Dashboard — ڈیش بورڈ", url: "/dashboard" },
        ])}
      />
    </>
  );
}
