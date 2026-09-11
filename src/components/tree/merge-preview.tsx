"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GitMerge, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { MergeCommonMember } from "@/types/tree";

// ============================================================
// MERGE PREVIEW — Scenario D: pick target tree, preview common
// members (score > 70%), execute merge (both trees must belong
// to the user — enforced by API).
// ============================================================

interface MergePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTreeId: string;
  onMerged: () => void;
}

interface TreeOption {
  id: string;
  name: string;
  memberCount: number;
  role: string;
}

interface Preview {
  targetTreeId: string;
  commonCount: number;
  copyCount: number;
  common: MergeCommonMember[];
}

export function MergePreview({ open, onOpenChange, sourceTreeId, onMerged }: MergePreviewProps) {
  const [trees, setTrees] = useState<TreeOption[]>([]);
  const [targetId, setTargetId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingTrees, setLoadingTrees] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingTrees(true);
    fetch("/api/tree")
      .then((r) => r.json())
      .then((j) => {
        setTrees((j.trees ?? []).filter((t: TreeOption) => t.id !== sourceTreeId));
      })
      .catch(() => toast.error("درختوں کی فہرست نہیں آئی"))
      .finally(() => setLoadingTrees(false));
    setTargetId("");
    setPreview(null);
  }, [open, sourceTreeId]);


  const runPreview = async () => {
    if (!targetId) {
      toast.error("ہدف والا درخت منتخب کریں");
      return;
    }
    setLoadingPreview(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/tree/${sourceTreeId}/merge?targetTreeId=${targetId}`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "پری ویو نہیں بن سکا");
      setPreview(j.preview);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoadingPreview(false);
    }
  };

  const execute = async () => {
    if (!targetId) return;
    setMerging(true);
    try {
      // 1) create merge request
      const res1 = await fetch(`/api/tree/${sourceTreeId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTreeId: targetId, message: "UI سے خودکار انضمام" }),
      });
      const j1 = await res1.json().catch(() => null);
      if (!res1.ok) throw new Error(j1?.error || "درخواست نہیں بنی");
      const requestId = j1?.request?.id;
      // 2) approve as target owner
      const res2 = await fetch(`/api/tree/${targetId}/merge/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve: true }),
      });
      const j2 = await res2.json().catch(() => null);
      if (!res2.ok) throw new Error(j2?.error || "انضمام نہیں ہو سکا");
      toast.success(
        j2?.message ??
          `درخت ملا دیے گئے — ${j2?.copiedMembers ?? 0} ممبر کاپی ہوئے`
      );
      onOpenChange(false);
      onMerged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>درخت ملا دیں — Tree Merge</DialogTitle>
          <DialogDescription>
            یہ درخت آپ کے دوسرے درخت میں ضم ہو جائے گا — مشترکہ ممبرز ایک ہی رہیں گے
          </DialogDescription>
        </DialogHeader>

        {loadingTrees ? (
          <Skeleton className="h-10 w-full" />
        ) : trees.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Koi data nahi mila — آپ کے پاس دوسرا کوئی درخت نہیں
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ہدف والا درخت منتخب کریں</label>
              <Select value={targetId} onValueChange={(v) => { setTargetId(v); setPreview(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="درخت منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  {trees.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.memberCount} ممبرز
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" className="h-8" disabled={loadingPreview} onClick={runPreview}>
              <Search className="mr-1 h-3.5 w-3.5" />
              {loadingPreview ? "چیک ہو رہا ہے..." : "مشترکہ ممبرز چیک کریں"}
            </Button>

            {loadingPreview && <Skeleton className="h-24 w-full" />}

            {preview && (
              <div className="rounded-xl border p-3">
                <p className="text-sm font-semibold text-gray-700">
                  {preview.commonCount > 0 ? (
                    <>مشترکہ ممبرز: {preview.commonCount} · نئے ممبرز: {preview.copyCount}</>
                  ) : (
                    <>کوئی مشترکہ ممبر نہیں — {preview.copyCount} ممبرز کاپی ہوں گے</>
                  )}
                </p>
                {preview.common.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {preview.common.map((c, i) => (
                      <div key={i} className="flex flex-wrap items-center justify-between gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs">
                        <span className="text-gray-700">
                          {c.sourceName} <span className="text-gray-400">↔</span> {c.targetName}
                        </span>
                        <span className="font-bold text-emerald-700">{c.score}%</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-gray-400">
                  مشترکہ ممبرز کے رشتے دوبارہ جوڑے جائیں گے — کمنٹس، واقعات اور کہانیاں بھی منتقل ہوں گی
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merging}>
                منسوخ
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={merging || !targetId} onClick={execute}>
                {merging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitMerge className="mr-2 h-4 w-4" />}
                {merging ? "ملا رہے ہیں..." : "درخت ملا دیں"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
