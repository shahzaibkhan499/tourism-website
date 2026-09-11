import type { Metadata } from "next";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

// ============================================================
// SEO HELPERS — metadata builder + JSON-LD structured data.
// Phase 6 (master prompt): unique titles/descriptions, OG,
// Twitter cards, canonical, hreflang, Organization/WebSite/
// Event/Person/BreadcrumbList schemas.
// ============================================================

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function buildMetadata(opts: {
  title: string; // English
  titleUrdu: string; // Urdu
  description?: string;
  path?: string; // canonical path, e.g. /events
  noIndex?: boolean;
}): Metadata {
  const title = `${opts.title} — ${opts.titleUrdu}`;
  const description =
    opts.description ??
    `${opts.title} — ${APP_NAME}: پاکستان کا پہلا مکمل ڈیجیٹل فیملی پلیٹ فارم۔ شجرہ نسب، ایونٹس، رشتہ، نوکریاں، یادیں اور مزید۔`;
  const url = `${SITE_URL}${opts.path ?? ""}`;
  return {
    title,
    description,
    alternates: {
      canonical: opts.path ? url : undefined,
      languages: {
        en: url,
        ur: url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: APP_NAME,
      images: [`${SITE_URL}/opengraph-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/opengraph-image.png`],
    },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

// ---------- JSON-LD blocks ----------
export interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description: APP_DESCRIPTION,
    sameAs: [],
  };
}

export function webSiteLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: SITE_URL,
    description: APP_DESCRIPTION,
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function eventLd(event: {
  name: string;
  description: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  city?: string | null;
  image?: string | null;
  url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description ?? `${event.name} — ${APP_NAME}`,
    startDate: event.startDate,
    endDate: event.endDate ?? event.startDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.location
      ? {
          "@type": "Place",
          name: event.location,
          address: event.city ? { "@type": "PostalAddress", addressLocality: event.city } : undefined,
        }
      : undefined,
    image: event.image ? [event.image] : undefined,
    url: event.url,
  };
}

export function personLd(person: {
  name: string;
  bio?: string | null;
  image?: string | null;
  city?: string | null;
  url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    description: person.bio ?? undefined,
    image: person.image ?? undefined,
    address: person.city ? { "@type": "PostalAddress", addressLocality: person.city } : undefined,
    url: person.url,
  };
}

export function faqLd(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

