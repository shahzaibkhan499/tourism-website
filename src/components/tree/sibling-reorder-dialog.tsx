"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fullName, sortSiblings } from "@/lib/tree-utils";
import type { TreeGraphData } from "@/lib/tree-graph";

// ============================================================
// SIBLING REORDER DIALOG — Step 11b: reorder siblings.
// HTML5 drag-and-drop + up/down arrows (mobile friendly).
// Saves via PUT /api/tree/[treeId]/members/reorder.
// ============================================================

interface SiblingReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  memberId: string;
  onSaved: () => void;
}

export function SiblingReorderDialog({ open, onOpenChange, treeId, graph, memberId, onSaved }: SiblingReorderDialogProps) {
  const [order, setOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const parentIds = graph.parentIdsOf.get(memberId) ?? [];
    const siblings = new Set<string>();
    for (const pid of parentIds) {
      for (const c of graph.childrenIdsOf.get(pid) ?? []) {
        if (c !== memberId) siblings.add(c);
      }
    }
    const sorted = sortSiblings(
      [memberId, ...Array.from(siblings)],
      graph.memberById,
      graph.relTypeOf,
      parentIds[0] ?? "",
      true
    );
    setOrder(sorted);
  }, [open, memberId, graph]);

  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  // Reset to birth order: oldest first (leftmost), nulls last, ties by name
  const resetToBirthOrder = () => {
    setOrder((prev) =>
      [...prev].sort((a, b) => {
        const ma = graph.memberById.get(a);
        const mb = graph.memberById.get(b);
        if (!ma || !mb) return 0;
        const da = ma.dateOfBirth ? new Date(ma.dateOfBirth).getTime() : null;
        const db = mb.dateOfBirth ? new Date(mb.dateOfBirth).getTime() : null;
        if (da !== db) {
          if (da === null) return 1;
          if (db === null) return -1;
          return da - db;
        }
        return fullName(ma).localeCompare(fullName(mb), "en", { sensitivity: "base" });
      })
    );
    toast.success("پیدائش کی ترتیب بحال کر دی گئی — محفوظ کرنا نہ بھولیں");
  };

  const onDragStart = (index: number) => setDragIndex(index);
  const onDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/members/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.map((id, index) => ({ memberId: id, sortOrder: index + 1 })),
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ترتیب محفوظ نہیں ہوئی");
      toast.success(j?.message || "ترتیب محفوظ ہو گئی");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>بہن بھائیوں کی ترتیب — Sibling Order</DialogTitle>
          <DialogDescription>
            بڑا پہلے (بائیں)، چھوٹا بعد میں — گھسیٹیں یا تیر استعمال کریں
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={saving}
          onClick={resetToBirthOrder}
        >
          پیدائش کی ترتیب پر واپس — Reset to Birth Order
        </Button>

        {order.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila</p>
        ) : (
          <div className="space-y-1.5">
            {order.map((id, index) => {
              const m = graph.memberById.get(id);
              if (!m) return null;
              const isSelf = id === memberId;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(index)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    dragIndex === index ? "border-emerald-400 bg-emerald-50" : isSelf ? "border-emerald-300 bg-emerald-50/50" : "bg-white"
                  } ${dragIndex !== null ? "cursor-grabbing" : "cursor-grab"}`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                  <span className="flex-1 truncate text-sm font-medium text-gray-800">
                    {index + 1}. {fullName(m)}
                    {isSelf && <span className="ml-1 text-xs text-emerald-600">(یہ ممبر)</span>}
                    {m.dateOfBirth && (
                      <span className="ml-2 text-xs text-gray-400">
                        b.{new Date(m.dateOfBirth).getFullYear()}
                      </span>
                    )}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, -1)} aria-label="Move up" disabled={index === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, 1)} aria-label="Move down" disabled={index === order.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            منسوخ
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={save}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ترتیب محفوظ کریں
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
