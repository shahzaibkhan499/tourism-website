"use client";

/**
 * Round 10 — categorized grid of event-type buttons (Fix 1).
 * The user picks a specific event type first, then its dynamic form opens.
 */

import Link from "next/link";
import { HeartPulse, Users, MoonStar, Briefcase, MoreHorizontal, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getEventTypeInfo, EVENT_CREATE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Users,
  MoonStar,
  Briefcase,
  MoreHorizontal,
};

export function EventCategoryGrid() {
  return (
    <div className="space-y-6">
      {EVENT_CREATE_CATEGORIES.map((cat) => {
        const Icon = ICONS[cat.icon] ?? MoreHorizontal;
        return (
          <Card key={cat.id} className="overflow-hidden">
            <div className={cn("flex items-center gap-3 bg-gradient-to-r px-5 py-3 text-white", cat.accent)}>
              <Icon className="h-5 w-5" />
              <h2 className="text-base font-semibold">{cat.label}</h2>
              <span className="text-sm text-white/80" dir="rtl">
                {cat.labelUrdu}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {cat.types.map((t) => {
                const info = getEventTypeInfo(t.value);
                return (
                  <Link
                    key={t.value}
                    href={`/events/create?type=${t.value}`}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
                  >
                    <span className="text-2xl" aria-hidden>
                      {info.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800 group-hover:text-emerald-700">
                        {t.label}
                      </span>
                      <span className="block truncate text-xs text-gray-400" dir="rtl">
                        {info.labelUrdu}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                  </Link>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
