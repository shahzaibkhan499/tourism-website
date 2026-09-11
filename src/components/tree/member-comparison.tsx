"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Scale } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { TreeGraphData } from "@/lib/tree-graph";
import { fullName } from "@/lib/tree-utils";
import type { MemberComparisonResult } from "@/types/tree";

// ============================================================
// MEMBER COMPARISON — side-by-side field comparison of 2 members.
// ============================================================

interface MemberComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
}

export function MemberComparison({ open, onOpenChange, treeId, graph }: MemberComparisonProps) {
  const [member1Id, setMember1Id] = useState("");
  const [member2Id, setMember2Id] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MemberComparisonResult | null>(null);

  const sorted = useMemo(
    () => [...graph.members].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [graph.members]
  );

  const compare = async () => {
    if (!member1Id || !member2Id || member1Id === member2Id) {
      toast.error("دو الگ ممبرز منتخب کریں");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member1Id, member2Id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "موازنہ نہیں ہو سکا");
      setResult(j);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ممبرز کا موازنہ — Compare Members</DialogTitle>
          <DialogDescription>دونوں ممبرز کی معلومات ساتھ ساتھ دیکھیں</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={member1Id} onValueChange={(v) => { setMember1Id(v); setResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="پہلا ممبر" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={m.id}>{fullName(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={member2Id} onValueChange={(v) => { setMember2Id(v); setResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="دوسرا ممبر" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={m.id}>{fullName(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={compare}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scale className="mr-2 h-4 w-4" />}
          موازنہ کریں
        </Button>

        {result && (
          <div className="max-h-80 overflow-y-auto rounded-xl border">
            <div className="grid grid-cols-3 gap-px bg-gray-200 text-center text-xs font-bold">
              <div className="bg-white px-2 py-2">میدان</div>
              <div className="bg-white px-2 py-2">{result.member1.name}</div>
              <div className="bg-white px-2 py-2">{result.member2.name}</div>
            </div>
            {result.rows.map((r) => (
              <div key={r.key} className="grid grid-cols-3 gap-px bg-gray-100 text-sm">
                <div className="bg-white px-2 py-1.5 text-xs font-medium text-gray-500">{r.label}</div>
                <div className={`bg-white px-2 py-1.5 ${r.same ? "text-emerald-700" : "text-gray-800"}`}>
                  {r.value1 ?? "—"} {r.same && r.value1 !== null && <Check className="inline h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <div className={`bg-white px-2 py-1.5 ${r.same ? "text-emerald-700" : "text-gray-800"}`}>
                  {r.value2 ?? "—"} {r.same && r.value2 !== null && <Check className="inline h-3.5 w-3.5 text-emerald-500" />}
                </div>
              </div>
            ))}
            <div className="bg-white px-3 py-2 text-xs text-gray-500">
              مشابہت: <span className="font-bold text-emerald-700">{result.similarity}%</span>
              {" "}({result.sameCount} میدان ایک جیسے)
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
