"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Route as RouteIcon, Users2 } from "lucide-react";
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
import type { TreeGraphData } from "@/lib/tree-graph";
import { fullName } from "@/lib/tree-utils";
import type { RelationshipPathResult } from "@/types/tree";

// ============================================================
// RELATIONSHIP CALCULATOR — pick two members, BFS via API,
// show Urdu rishta names + path chips.
// ============================================================

interface RelationshipCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
}

export function RelationshipCalculator({ open, onOpenChange, treeId, graph }: RelationshipCalculatorProps) {
  const [memberAId, setMemberAId] = useState("");
  const [memberBId, setMemberBId] = useState("");
  const [loading, setLoading] = useState(false);
  interface CalcResult extends RelationshipPathResult {
    found: boolean;
    fromMemberId: string;
    toMemberId: string;
    message?: string;
  }
  const [result, setResult] = useState<CalcResult | null>(null);

  const sorted = useMemo(
    () => [...graph.members].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [graph.members]
  );

  const calculate = async () => {
    if (!memberAId || !memberBId) {
      toast.error("دونوں ممبرز منتخب کریں");
      return;
    }
    if (memberAId === memberBId) {
      toast.error("ایک ہی ممبر دو بار منتخب نہ کریں");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/relationship-calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberAId, memberBId }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "رشتہ نہیں نکالا جا سکا");
      setResult(j);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  };

  const nameOf = (id: string) => {
    const m = graph.memberById.get(id);
    return m ? fullName(m) : id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>رشتہ نکالیں — Relationship Calculator</DialogTitle>
          <DialogDescription>دو ممبرز کے درمیان پاکستانی ناموں میں رشتہ معلوم کریں</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={memberAId} onValueChange={(v) => { setMemberAId(v); setResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="پہلا ممبر" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {fullName(m)} — {m.gender === "MALE" ? "مرد" : "خاتون"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={memberBId} onValueChange={(v) => { setMemberBId(v); setResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="دوسرا ممبر" />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {fullName(m)} — {m.gender === "MALE" ? "مرد" : "خاتون"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {result && (
          <div className="rounded-xl border bg-emerald-50/50 p-4">
            {result.found ? (
              <>
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">{nameOf(result.fromMemberId)}</span>
                    {"  →  "}
                    <span className="font-bold">{nameOf(result.toMemberId)}</span>
                  </p>
                </div>
                <p className="mt-2 text-lg font-bold text-emerald-700">
                  {result.names.length === 1 ? result.names[0] : result.names.join(" → ")}
                </p>
                {result.directName && (
                  <p className="mt-1 text-xs text-gray-500">{result.directName}</p>
                )}
                {result.pathIds.length > 1 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {result.pathIds.map((id, i) => (
                      <span key={id + i} className="flex items-center gap-1">
                        <span className="rounded-full border bg-white px-2 py-0.5 text-xs text-gray-700">
                          {nameOf(id)}
                        </span>
                        {i < result.pathIds.length - 1 && <span className="text-gray-400">→</span>}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  قربت: {result.score}%{result.sameBloodline ? " · ایک خون" : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">{result.message ?? "کوئی رشتہ نہیں ملا"}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بند کریں
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={calculate}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users2 className="mr-2 h-4 w-4" />}
            {loading ? "نکالا جا رہا ہے..." : "رشتہ نکالیں"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
