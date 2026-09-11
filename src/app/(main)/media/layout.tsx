import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Media",
  titleUrdu: "میڈیا",
  description: "خاندانی تصاویر اور ویڈیوز اپ لوڈ اور منظم کریں",
  path: "/media",
});

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Media — میڈیا", url: "/media" },
        ])}
      />
    </>
  );
}
