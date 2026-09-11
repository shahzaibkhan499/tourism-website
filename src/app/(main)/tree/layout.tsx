import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Family Tree",
  titleUrdu: "شجرہ نسب",
  description: "اپنے خاندان کا مکمل شجرہ نسب بنائیں — نسلیں، رشتے اور یادیں",
  path: "/tree",
});

export default function TreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Family Tree — شجرہ نسب", url: "/tree" },
        ])}
      />
    </>
  );
}
