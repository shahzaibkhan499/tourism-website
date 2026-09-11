import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Rishta",
  titleUrdu: "رشتہ",
  description: "پاکستانی خاندانوں کے لیے قابلِ اعتماد رشتہ پلیٹ فارم — پروفائلز اور درخواستیں",
  path: "/rishta",
});

export default function RishtaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Rishta — رشتہ", url: "/rishta" },
        ])}
      />
    </>
  );
}
