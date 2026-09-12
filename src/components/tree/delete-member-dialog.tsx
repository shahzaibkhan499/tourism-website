"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TreeGraphData } from "@/lib/tree-graph";
import { fullName } from "@/lib/tree-utils";

// ============================================================
// DELETE MEMBER DIALOG — children reassignment:
// reassign to another parent OR delete children too.
// ============================================================

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  memberId: string | null;
  graph: TreeGraphData;
  onDeleted: () => void;
}

export function DeleteMemberDialog({ open, onOpenChange, treeId, memberId, graph, onDeleted }: DeleteMemberDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [mode, setMode] = useState<"reassign" | "deleteChildren">("reassign");
  const [reassignToId, setReassignToId] = useState("");
  const [blocked, setBlocked] = useState(false);

  const member = memberId ? graph.memberById.get(memberId) : undefined;
  const children = useMemo(
    () => (memberId ? (graph.childrenIdsOf.get(memberId) ?? []).map((id) => graph.memberById.get(id)).filter(Boolean) : []),
    [memberId, graph]
  );
  const hasChildren = children.length > 0;

  useEffect(() => {
    if (open) {
      setMode("reassign");
      setReassignToId("");
      setBlocked(false);
    }
  }, [open]);

  const candidates = useMemo(
    () =>
      graph.members.filter(
        (m) =>
          m.id !== memberId &&
          (m.gender !== member?.gender || member?.gender === "FEMALE")
      ),
    [graph.members, memberId, member]
  );

  const confirm = async () => {
    if (!memberId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/members/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hasChildren
            ? mode === "reassign"
              ? { reassignToId: reassignToId || null }
              : { deleteChildren: true }
            : {}
        ),
      });
      const j = await res.json().catch(() => null);
      if (res.status === 409) {
        setBlocked(true);
        toast.error(j?.details?.message || j?.error || "Children exist — بچے موجود ہیں");
        return;
      }
      if (!res.ok) throw new Error(j?.error || "Could not delete — ڈیلیٹ نہیں ہو سکا");
      toast.success(j?.message || "Member deleted — ممبر ڈیلیٹ ہو گیا");
      onOpenChange(false);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong — کچھ غلط ہو گیا");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>ممبر ڈیلیٹ کریں؟</AlertDialogTitle>
          <AlertDialogDescription>
            {member ? (
              <>
                «{fullName(member)}» کو شجرے سے ہٹایا جائے گا۔
                {hasChildren && "This member has children — decide what to do with them first. اس کے بچے موجود ہیں — پہلے فیصلہ کریں کہ بچوں کا کیا کرنا ہے۔"}
              </>
            ) : (
              "Are you sure you want to delete this member? — کیا آپ واقعی یہ ممبر ڈیلیٹ کرنا چاہتے ہیں؟"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasChildren && (
          <div className="space-y-3 rounded-xl border bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">
              بچے ({children.length}): {children.map((c) => (c ? fullName(c) : "")).filter(Boolean).join("، ")}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                className="h-4 w-4"
                checked={mode === "reassign"}
                onChange={() => setMode("reassign")}
              />
              بچے کسی اور والدین کے حوالے کریں
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                className="h-4 w-4"
                checked={mode === "deleteChildren"}
                onChange={() => setMode("deleteChildren")}
              />
              بچے بھی ڈیلیٹ کر دیں
            </label>

            {mode === "reassign" && (
              <div className="space-y-1.5">
                <Label>نئے والدین منتخب کریں</Label>
                <Select value={reassignToId} onValueChange={setReassignToId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a member — ممبر منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {fullName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {blocked && <p className="text-xs text-red-600">نئے والدین کا انتخاب ضروری ہے</p>}
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>منسوخ</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting || (hasChildren && mode === "reassign" && !reassignToId)}
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
            جی ہاں، ڈیلیٹ کریں
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
