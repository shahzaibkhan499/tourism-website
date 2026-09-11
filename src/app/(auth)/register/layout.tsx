import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Register",
  titleUrdu: "اکاؤنٹ بنائیں",
  description: "مفت اکاؤنٹ بنائیں اور اپنے خاندان کا ڈیجیٹل سفر شروع کریں",
  path: "/register",
});

export default function RegisterMetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
