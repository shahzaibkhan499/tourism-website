import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { ContactSection } from "@/components/landing/contact";
import { Faq } from "@/components/landing/faq";
import { buildMetadata, faqLd, JsonLd } from "@/lib/seo";
import { FAQS } from "@/lib/faq-data";

export const metadata: Metadata = buildMetadata({
  title: "Digital Family Tree",
  titleUrdu: "آپ کا ڈیجیٹل خاندان",
  description:
    "Digital Family Tree — پاکستان کا مکمل ڈیجیٹل خاندانی پلیٹ فارم۔ شجرہ نسب، تقریبات، رشتہ، نوکریاں، یادیں اور کلان — سب ایک جگہ۔",
  path: "/",
});

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <CTA />
      <ContactSection />
      <Footer />
      <JsonLd data={faqLd(FAQS)} />
    </div>
  );
}
