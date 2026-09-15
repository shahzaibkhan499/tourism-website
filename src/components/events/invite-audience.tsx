"use client";

import { Users, TreePine, Landmark, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InviteAudience } from "@/lib/event-invites";
import { cn } from "@/lib/utils";

// ============================================================
// ROUND 12 — Invite Audience picker (Fix 1).
// One-click bulk invitations: Specific Persons / My Entire
// Family (Tree) / My Clan / My Community.
// ============================================================

export const AUDIENCE_OPTIONS: { value: InviteAudience; label: string; hint: string }[] = [
  {
    value: "SPECIFIC",
    label: "Specific Persons — مخصوص افراد",
    hint: "Select specific people to invite. — منتخب افراد کو مدعو کریں۔",
  },
  {
    value: "FAMILY",
    label: "My Entire Family (Tree) — مکمل خاندان",
    hint: "Every member linked to your Family Tree will get the Digital Card. — آپ کے فمیلی ٹری کے سارے ممبران کو ڈیجیٹل کارڈ موصول ہوگا۔",
  },
  {
    value: "CLAN",
    label: "My Clan — میرا قبیلہ",
    hint: "All members of your clan will get the Digital Card. — آپ کے قبیلے کے تمام ممبران کو ڈیجیٹل کارڈ موصول ہوگا۔",
  },
  {
    value: "COMMUNITY",
    label: "My Community — میری کمیونٹی",
    hint: "All members of your community will get the Digital Card. — آپ کی کمیونٹی کے تمام ممبران کو ڈیجیٹل کارڈ موصول ہوگا۔",
  },
];

const AUDIENCE_ICONS: Record<InviteAudience, typeof Users> = {
  SPECIFIC: Users,
  FAMILY: TreePine,
  CLAN: Landmark,
  COMMUNITY: Building2,
};

interface InviteAudienceSelectProps {
  value: InviteAudience;
  onValueChange: (value: InviteAudience) => void;
  disabled?: boolean;
  className?: string;
}

export function InviteAudienceSelect({
  value,
  onValueChange,
  disabled,
  className,
}: InviteAudienceSelectProps) {
  const selected = AUDIENCE_OPTIONS.find((o) => o.value === value) ?? AUDIENCE_OPTIONS[0];
  const Icon = AUDIENCE_ICONS[value];
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-gray-700">
        <span dir="ltr">Invite Audience</span>
        <span className="text-gray-400"> — </span>
        <span dir="rtl" className="font-urdu">
          دعوت نامہ بھیجیں
        </span>
      </label>
      <Select value={value} onValueChange={(v) => onValueChange(v as InviteAudience)} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Invite Audience — دعوت نامہ بھیجیں" />
        </SelectTrigger>
        <SelectContent>
          {AUDIENCE_OPTIONS.map((o) => {
            const OptIcon = AUDIENCE_ICONS[o.value];
            return (
              <SelectItem key={o.value} value={o.value}>
                <span className="flex items-center gap-2">
                  <OptIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="whitespace-nowrap">
                    <span dir="ltr">{o.label.split("—")[0].trim()}</span>
                    <span className="text-gray-400"> — </span>
                    <span dir="rtl" className="font-urdu">
                      {o.label.split("—")[1]?.trim()}
                    </span>
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <p className="flex items-start gap-1.5 text-xs text-gray-500" dir="auto">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        {selected.hint}
      </p>
    </div>
  );
}
