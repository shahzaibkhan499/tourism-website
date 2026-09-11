import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Occupation",
  titleUrdu: "روزگار",
  description: "اپنا پیشہ اور روزگار پروفائل بنائیں — ملازمت یا کاروبار",
  path: "/occupation",
});

export default function OccupationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Occupation — روزگار", url: "/occupation" },
        ])}
      />
    </>
  );
}
