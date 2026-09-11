import Link from "next/link";
import { TreePine } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Events", href: "/events" },
      { label: "Community & Clans", href: "/community" },
      { label: "رشتہ", href: "/rishta" },
      { label: "Jobs", href: "/jobs" },
      { label: "Business Directory", href: "/business" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Memories", href: "/memories" },
      { label: "Media Library", href: "/media" },
      { label: "Buzurg Mode", href: "/buzurg" },
      { label: "Kids Zone", href: "/kids" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact Us", href: "/#contact" },
      { label: "Privacy Policy", href: "/#footer" },
      { label: "Terms of Service", href: "/#footer" },
      { label: "Help Center", href: "/#footer" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 text-gray-300">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <TreePine className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white">
              {APP_NAME.split(" ")[0]}{" "}
              <span className="text-emerald-400">{APP_NAME.split(" ").slice(1).join(" ")}</span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Pakistan ka pehla complete digital family platform. Apne khandaan ko jodein, yaadein mehfooz karein, aur
            apni community ke saath barhein.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-semibold text-white">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-emerald-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-800">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-gray-500 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <span>Made with ❤️ in Pakistan 🇵🇰</span>
        </div>
      </div>
    </footer>
  );
}
