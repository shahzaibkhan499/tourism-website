"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/faq-data";

// ============================================================
// LANDING FAQ — semantic H2 + accordion (SEO: H2/H3 hierarchy).
// ============================================================


export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-16">
      <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
        اکثر پوچھے جانے والے سوالات
      </h2>
      <p className="mt-3 text-center text-gray-600">Frequently Asked Questions</p>
      <div className="mt-8 space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              aria-expanded={open === i}
            >
              <h3 className="font-semibold text-gray-900">{f.q}</h3>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-emerald-600 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            {open === i && <p className="px-5 pb-4 text-gray-600">{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
