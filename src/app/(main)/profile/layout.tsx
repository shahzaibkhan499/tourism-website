import type { Metadata } from "next";
import { buildMetadata, breadcrumbLd, JsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Profile",
  titleUrdu: "پروفائل",
  description: "اپنی ڈیجیٹل شناخت — ذاتی معلومات، تعلیم، پیشہ اور خاندان",
  path: "/profile",
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: "/" },
          { name: "Profile — پروفائل", url: "/profile" },
        ])}
      />
    </>
  );
}
