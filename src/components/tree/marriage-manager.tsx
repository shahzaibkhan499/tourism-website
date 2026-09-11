"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HeartHandshake, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeMarriageDto } from "@/types/tree";
import { fullName, sortMarriages, MARRIAGE_STATUS_META } from "@/lib/tree-utils";
import { EditMarriageModal } from "@/components/tree/edit-marriage-modal";

// ============================================================
// MARRIAGE MANAGER — Step 16: list all marriages with status,
// edit (dates/status/type/divorce) and delete.
// ============================================================

interface MarriageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  onSaved: () => void;
}

export function MarriageManager({ open, onOpenChange, treeId, graph, onSaved }: MarriageManagerProps) {
  const [editing, setEditing] = useState<TreeMarriageDto | null>(null);

  const marriages = sortMarriages(
    Array.from(graph.marriageById.values())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>شادیوں کا انتظام — Marriages</DialogTitle>
            <DialogDescription>
              ترمیم، طلاق (DIVORCED) یا ڈیلیٹ کریں — ایک شخص کی کئی شادیاں ممکن ہیں
            </DialogDescription>
          </DialogHeader>

          {marriages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Koi data nahi mila — ابھی کوئی شادی درج نہیں
            </p>
          ) : (
            <div className="space-y-2">
              {marriages.map((m) => {
                const s1 = graph.memberById.get(m.spouse1Id);
                const s2 = graph.memberById.get(m.spouse2Id);
                const meta = MARRIAGE_STATUS_META[m.status] ?? MARRIAGE_STATUS_META.MARRIED;
                return (
                  <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {s1 ? fullName(s1) : "—"} <HeartHandshake className="inline h-3.5 w-3.5 text-pink-500" />{" "}
                        {s2 ? fullName(s2) : "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {m.date ? new Date(m.date).toLocaleDateString("en-GB") + " · " : ""}
                        {m.location ?? ""}
                        {" · "}
                        {m.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: meta.color + "33", color: m.status === "MARRIED" ? "#be185d" : "#4b5563" }}
                      >
                        {meta.label} — {meta.urdu}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setEditing(m)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        ترمیم
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditMarriageModal
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        treeId={treeId}
        marriage={editing}
        spouse1Name={editing ? (graph.memberById.get(editing.spouse1Id) ? fullName(graph.memberById.get(editing.spouse1Id)!) : "—") : ""}
        spouse2Name={editing ? (graph.memberById.get(editing.spouse2Id) ? fullName(graph.memberById.get(editing.spouse2Id)!) : "—") : ""}
        onSaved={() => {
          setEditing(null);
          onSaved();
        }}
      />
    </>
  );
}
