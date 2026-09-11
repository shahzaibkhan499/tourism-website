import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Business",
  titleUrdu: "کاروبار",
  description: "اپنا کاروبار رجسٹر کریں، پروفائل بنائیں اور صارفین تک پہنچیں",
  path: "/business",
});

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Business — کاروبار", url: "/business" },
        ])}
      />
    </>
  );
}
