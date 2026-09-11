import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Jobs",
  titleUrdu: "نوکریاں",
  description: "پاکستان کی تازہ ترین نوکریاں تلاش کریں اور براہِ راست درخواست دیں",
  path: "/jobs",
});

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Jobs — نوکریاں", url: "/jobs" },
        ])}
      />
    </>
  );
}
