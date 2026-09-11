import type { Metadata } from "next";
import { Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { JsonLd, organizationLd, webSiteLd } from "@/lib/seo";
import { Providers } from "@/components/providers";
import { AudioInitializer } from "@/components/shared/audio-initializer";
import { ThemeApplier } from "@/components/shared/theme-applier";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const urdu = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["400", "700"], variable: "--font-urdu", display: "swap" });

// Parse NEXT_PUBLIC_APP_URL safely: if the env value is malformed
// (missing https://, extra characters, etc.) we fall back to localhost
// instead of crashing the production build.
function safeUrl(raw: string | undefined, fallback: string): URL {
  try {
    const candidate = (raw ?? "").trim();
    return new URL(candidate || fallback);
  } catch {
    return new URL(fallback);
  }
}

export const metadata: Metadata = {
  metadataBase: safeUrl(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  title: {
    default: `${APP_NAME} — آپ کا ڈیجیٹل خاندان`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["Digital Family Tree", "family platform Pakistan", "family tree", "Pakistani events", "clans", "rishta", "jobs", "memories"],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: `${APP_NAME} — Apne Khandaan Ko Digital بنائیں`,
    description: APP_DESCRIPTION,
    type: "website",
    images: ["/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Apne Khandaan Ko Digital بنائیں`,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  alternates: {
    languages: {
      en: "/",
      ur: "/",
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" suppressHydrationWarning>
      <body className={`${inter.variable} ${urdu.variable} font-sans antialiased`}>
        <JsonLd data={organizationLd()} />
        <JsonLd data={webSiteLd()} />
        <AudioInitializer />
        <ThemeApplier />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
