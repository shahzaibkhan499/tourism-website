"use client";

import { X } from "lucide-react";
import { REL_TYPE_META, GENDER_COLORS, DECEASED_COLOR, MARRIAGE_COLOR } from "@/lib/tree-utils";
import { Button } from "@/components/ui/button";
import { useTreeStore } from "@/stores/tree-store";

// ============================================================
// TREE LEGEND — colors/lines explanation overlay.
// ============================================================

export function TreeLegend() {
  const showLegend = useTreeStore((s) => s.showLegend);
  const toggleLegend = useTreeStore((s) => s.toggleLegend);
  if (!showLegend) return null;

  return (
    <div className="absolute bottom-3 left-3 z-20 w-56 rounded-xl border bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">رہنما — Legend</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleLegend} aria-label="Close legend">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ul className="space-y-1.5 text-xs text-gray-600">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: GENDER_COLORS.MALE }} />
          مرد (Male)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: GENDER_COLORS.FEMALE }} />
          خاتون (Female)
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border-2" style={{ borderColor: DECEASED_COLOR }} />
          فوت شدہ 🕯️
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border-2 border-green-600" />
          منتخب (Selected)
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="8">
            <line x1="0" y1="4" x2="28" y2="4" stroke={REL_TYPE_META.BIOLOGICAL.stroke} strokeWidth="2" />
          </svg>
          حقیقی رشتہ
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="8">
            <line x1="0" y1="4" x2="28" y2="4" stroke={REL_TYPE_META.ADOPTED.stroke} strokeWidth="2" strokeDasharray="6,4" />
          </svg>
          لے پالک
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="8">
            <line x1="0" y1="4" x2="28" y2="4" stroke={REL_TYPE_META.STEP.stroke} strokeWidth="2" strokeDasharray="2,4" />
          </svg>
          سوتیلا
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="10">
            <line x1="0" y1="3" x2="28" y2="3" stroke={MARRIAGE_COLOR} strokeWidth="1.5" />
            <line x1="0" y1="7" x2="28" y2="7" stroke={MARRIAGE_COLOR} strokeWidth="1.5" />
          </svg>
          شادی (Marriage)
        </li>
        <li className="flex items-center gap-2">
          <svg width="28" height="10">
            <line x1="0" y1="3" x2="28" y2="3" stroke="#9ca3af" strokeWidth="1.5" />
            <line x1="0" y1="7" x2="28" y2="7" stroke="#9ca3af" strokeWidth="1.5" />
            <text x="12" y="8" fontSize="8" fill="#6b7280">✗</text>
          </svg>
          طلاق (Divorced)
        </li>
      </ul>
      <p className="mt-2 border-t pt-2 text-[11px] text-gray-400">
        Ctrl+F تلاش · +/− زوم · تیر بٹن پین · R ری سیٹ · Esc خالی کریں
      </p>
    </div>
  );
}
