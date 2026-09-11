import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Notifications",
  titleUrdu: "اطلاعات",
  description: "آپ کی تمام اطلاعات — ایونٹس، رشتہ، نوکریاں اور مزید",
  path: "/notifications",
});

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Notifications — اطلاعات", url: "/notifications" },
        ])}
      />
    </>
  );
}
