"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ============================================================
// QUICK ADD BUTTON — GenoPro-style relationship button.
// Color variants: blue (male relations), pink (female),
// purple (spouse). Disabled state shows a tooltip.
// ============================================================

export type QuickAddVariant = "male" | "female" | "spouse";

const VARIANTS: Record<QuickAddVariant, { btn: string; icon: string }> = {
  male: {
    btn: "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900",
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  female: {
    btn: "border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-300 hover:bg-pink-100 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-300 dark:hover:bg-pink-900",
    icon: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  },
  spouse: {
    btn: "border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-300 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900",
    icon: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
};

interface QuickAddButtonProps {
  emoji: string;
  label: string;
  labelUrdu: string;
  variant: QuickAddVariant;
  disabled?: boolean;
  disabledTooltip?: string;
  onClick: () => void;
}

export function QuickAddButton({ emoji, label, labelUrdu, variant, disabled = false, disabledTooltip, onClick }: QuickAddButtonProps) {
  const v = VARIANTS[variant];
  const button = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Add ${label} — ${labelUrdu} شامل کریں`}
      className={cn(
        "flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors",
        v.btn,
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full text-lg", v.icon)} aria-hidden>
        {emoji}
      </span>
      <span className="text-xs font-semibold leading-tight">
        Add {label}
        <span className="block font-urdu text-[11px] font-normal opacity-80">{labelUrdu}</span>
      </span>
    </button>
  );

  if (disabled && disabledTooltip) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">{button}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return button;
}
