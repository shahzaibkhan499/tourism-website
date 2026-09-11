import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Memories",
  titleUrdu: "یادیں",
  description: "خاندانی یادیں محفوظ کریں — تصاویر، کہانیاں اور لمحات",
  path: "/memories",
});

export default function MemoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Memories — یادیں", url: "/memories" },
        ])}
      />
    </>
  );
}
