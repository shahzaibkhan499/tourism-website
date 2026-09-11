import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Community",
  titleUrdu: "برادری",
  description: "اپنی برادری اور کلان تلاش کریں، ممبر بنیں اور خاندانی رابطے مضبوط کریں",
  path: "/community",
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Community — برادری", url: "/community" },
        ])}
      />
    </>
  );
}
