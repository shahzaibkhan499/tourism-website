"use client";

import { AlertTriangle, Check, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DuplicateCandidate } from "@/types/tree";
import { fullName, formatDate } from "@/lib/tree-utils";

// ============================================================
// DUPLICATE ALERT — "POSSIBLE DUPLICATE DETECTED" card per spec:
// new vs existing with score, [Same Person - Merge] [Different]
// [Skip]. 80-100 blocked, 60-79 warning.
// ============================================================

interface DuplicateAlertProps {
  candidates: DuplicateCandidate[];
  blocked?: boolean;
  busy?: boolean;
  onMerge?: (c: DuplicateCandidate) => void;
  onSkip?: (c: DuplicateCandidate) => void;
  onDismiss?: () => void;
}

export function DuplicateAlert({ candidates, blocked, busy, onMerge, onSkip, onDismiss }: DuplicateAlertProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ Possible Duplicate Detected — ممکنہ ڈپلیکیٹ ملا
          </p>
          {blocked && (
            <p className="mt-0.5 text-xs text-amber-700">
              ممبر پہلے ہی شامل ہو گیا ہے — براہ کرم تصدیق کریں
            </p>
          )}
        </div>
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="text-amber-600 hover:text-amber-800" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 space-y-2">
        {candidates.map((c, i) => (
          <div key={i} className="rounded-lg border border-amber-200 bg-white p-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">{fullName(c.member1)}</span>
                {c.member1.dateOfBirth && (
                  <span className="text-gray-500"> (b.{formatDate(c.member1.dateOfBirth)})</span>
                )}
                <span className="mx-1 text-gray-400">↔</span>
                <span className="font-semibold text-gray-800">{fullName(c.member2)}</span>
                {c.member2.dateOfBirth && (
                  <span className="text-gray-500"> (b.{formatDate(c.member2.dateOfBirth)})</span>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  c.score >= 80 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                Match Score: {c.score}%
              </span>
            </div>
            {(onMerge || onSkip) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {onMerge && (
                  <Button size="sm" className="h-7 bg-emerald-600 text-xs" disabled={busy} onClick={() => onMerge(c)}>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Same Person — Merge · ایک ہی شخص
                  </Button>
                )}
                {onSkip && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={() => onSkip(c)}>
                    <SkipForward className="mr-1 h-3.5 w-3.5" />
                    Skip · چھوڑیں
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
