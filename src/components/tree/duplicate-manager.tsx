"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, GitMerge, Loader2, RefreshCw, SkipForward } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DuplicateAlert } from "@/components/tree/duplicate-alert";
import type { DuplicateCandidate } from "@/types/tree";

// ============================================================
// DUPLICATE MANAGER — full duplicate detection + resolution
// (merge / skip) per pair.
// ============================================================

interface DuplicateManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  onResolved: () => void;
}

interface DupRow {
  member1: DuplicateCandidate["member1"];
  member2: DuplicateCandidate["member2"];
  score: number;
  severity: "HIGH" | "MEDIUM";
}

export function DuplicateManager({ open, onOpenChange, treeId, onResolved }: DuplicateManagerProps) {
  const [rows, setRows] = useState<DupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/duplicates`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ڈپلیکیٹس نہیں مل سکے");
      setRows(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const resolve = async (row: DupRow, action: "MERGE" | "SKIP") => {
    setBusy(`${row.member1.id}|${row.member2.id}`);
    try {
      const res = await fetch(`/api/tree/${treeId}/duplicates/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member1Id: row.member1.id, member2Id: row.member2.id, action }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "حل نہیں ہو سکا");
      toast.success(j?.message || (action === "MERGE" ? "ملا دیے گئے" : "چھوڑ دیا گیا"));
      onResolved();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ڈپلیکیٹ ممبرز — Duplicates</DialogTitle>
          <DialogDescription>
            80+ اسکور = ممکنہ ایک ہی شخص · 60–79 = مشتبہ — جائزہ لے کر ملا دیں یا چھوڑ دیں
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="h-8" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            دوبارہ چیک کریں
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm text-gray-600">کوئی ڈپلیکیٹ نہیں ملا — سب صاف ہے ✓</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.member1.id + r.member2.id} className="rounded-xl border p-2">
                <DuplicateAlert
                  candidates={[{ member1: r.member1, member2: r.member2, score: r.score }]}
                  blocked={r.score >= 80}
                  busy={busy === `${r.member1.id}|${r.member2.id}`}
                  onMerge={() => resolve(r, "MERGE")}
                  onSkip={() => resolve(r, "SKIP")}
                />
              </div>
            ))}
          </div>
        )}

        <p className="border-t pt-2 text-center text-xs text-gray-400">
          <GitMerge className="mr-1 inline h-3.5 w-3.5" />
          Merge میں دوسرے ممبر کے رشتے، شادیاں، کمنٹس اور کہانیاں پہلے ممبر میں منتقل ہو جاتی ہیں
        </p>
      </DialogContent>
    </Dialog>
  );
}
