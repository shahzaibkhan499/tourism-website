"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { RelationshipType, TreeRelationshipDto } from "@/types/tree";
import { fullName, REL_TYPE_META } from "@/lib/tree-utils";

// ============================================================
// RELATIONSHIP MANAGER — Step 17: list parent-child links,
// change type (biological/adopted/step/guardian/foster),
// remove links.
// ============================================================

interface RelationshipManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  relationships: TreeRelationshipDto[];
  onSaved: () => void;
}

const TYPES: RelationshipType[] = ["BIOLOGICAL", "ADOPTED", "STEP", "GUARDIAN", "FOSTER"];

export function RelationshipManager({ open, onOpenChange, treeId, graph, relationships, onSaved }: RelationshipManagerProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<TreeRelationshipDto | null>(null);

  const changeType = async (rel: TreeRelationshipDto, type: RelationshipType) => {
    setBusyId(rel.id);
    try {
      const res = await fetch(`/api/tree/${treeId}/relationships/${rel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "قسم نہیں بدلی");
      toast.success(j?.message || "رشتے کی قسم بدل گئی");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      const res = await fetch(`/api/tree/${treeId}/relationships/${removing.id}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "رشتہ نہیں ہٹا");
      toast.success(j?.message || "رشتہ ہٹا دیا گیا");
      setRemoving(null);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>رشتوں کا انتظام — Relationships</DialogTitle>
            <DialogDescription>
              والدین-بچے کے رشتوں کی قسم بدلیں یا ہٹائیں
            </DialogDescription>
          </DialogHeader>

          {relationships.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Koi data nahi mila — ابھی کوئی رشتہ درج نہیں
            </p>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => {
                const parent = graph.memberById.get(rel.parentId);
                const child = graph.memberById.get(rel.childId);
                const meta = REL_TYPE_META[rel.type] ?? REL_TYPE_META.BIOLOGICAL;
                return (
                  <div key={rel.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {parent ? fullName(parent) : "—"} <Link2 className="inline h-3.5 w-3.5 text-emerald-600" />{" "}
                        {child ? fullName(child) : "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {meta.label} — {meta.urdu}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={rel.type}
                        onValueChange={(v) => changeType(rel, v as RelationshipType)}
                        disabled={busyId === rel.id}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {REL_TYPE_META[t].label} — {REL_TYPE_META[t].urdu}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => setRemoving(rel)}
                        aria-label="Remove relationship"
                      >
                        {busyId === rel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removing)} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>رشتہ ہٹا دیں؟</AlertDialogTitle>
            <AlertDialogDescription>
              {removing
                ? `${graph.memberById.get(removing.parentId) ? fullName(graph.memberById.get(removing.parentId)!) : "—"} → ${
                    graph.memberById.get(removing.childId) ? fullName(graph.memberById.get(removing.childId)!) : "—"
                  } کا رشتہ ختم ہو جائے گا۔`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                confirmRemove();
              }}
            >
              جی ہاں، ہٹا دیں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
