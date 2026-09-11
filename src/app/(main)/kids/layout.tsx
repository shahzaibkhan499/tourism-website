import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kids",
  titleUrdu: "بچے",
  description: "بچوں کے لیے محفوظ اور تفریحی زون — کہانیاں اور کھیل",
  path: "/kids",
});

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Kids — بچے", url: "/kids" },
        ])}
      />
    </>
  );
}
