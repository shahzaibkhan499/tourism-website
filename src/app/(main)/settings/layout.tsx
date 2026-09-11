import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  titleUrdu: "ترتیبات",
  description: "اکاؤنٹ، رازداری، سیکیورٹی اور اطلاع کی ترجیحات",
  path: "/settings",
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Settings — ترتیبات", url: "/settings" },
        ])}
      />
    </>
  );
}
