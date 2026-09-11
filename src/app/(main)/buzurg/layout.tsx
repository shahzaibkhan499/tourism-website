import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Buzurg Mode",
  titleUrdu: "بزرگ موڈ",
  description: "بزرگوں کے لیے آسان انٹرفیس — قرآن سنیں، دوا یاد دہانی، ویڈیو کال",
  path: "/buzurg",
});

export default function BuzurgLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Buzurg Mode — بزرگ موڈ", url: "/buzurg" },
        ])}
      />
    </>
  );
}
