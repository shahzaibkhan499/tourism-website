import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Reset Password",
  titleUrdu: "نیا پاس ورڈ",
  description: "اپنے اکاؤنٹ کے لیے نیا پاس ورڈ سیٹ کریں",
  path: "/reset-password",
});

export default function ResetPasswordMetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
