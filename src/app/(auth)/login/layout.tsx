import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Login",
  titleUrdu: "لاگ ان",
  description: "اپنے اکاؤنٹ میں داخل ہوں — خاندان، تقریبات اور شجرہ نسب تک رسائی",
  path: "/login",
});

export default function LoginMetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
