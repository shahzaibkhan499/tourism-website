import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Forgot Password",
  titleUrdu: "پاس ورڈ بھول گئے؟",
  description: "اپنا پاس ورڈ دوبارہ حاصل کریں — ای میل کے ذریعے محفوظ طریقے سے",
  path: "/forgot-password",
});

export default function ForgotPasswordMetadataLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
