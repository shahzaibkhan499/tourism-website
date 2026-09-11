import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Events",
  titleUrdu: "ایونٹس",
  description: "خاندانی تقریبات بنائیں اور ان میں شامل ہوں — شادی، ولیمہ، دعوت، ملاقات",
  path: "/events",
});

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Events — ایونٹس", url: "/events" },
        ])}
      />
    </>
  );
}
