"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// VERSION HISTORY — timeline of all changes (tree_versions)
// with per-version undo.
// ============================================================

interface VersionHistoryProps {
  treeId: string;
}

interface VersionDto {
  id: string;
  action: string;
  user: { id: string; name: string | null; email: string } | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  MEMBER_ADD: "ممبر شامل ہوا",
  MEMBER_UPDATE: "ممبر اپ ڈیٹ ہوا",
  MEMBER_DELETE: "ممبر ڈیلیٹ ہوا",
  RELATIONSHIP_ADD: "رشتہ شامل ہوا",
  RELATIONSHIP_UPDATE: "رشتہ بدلا",
  RELATIONSHIP_REMOVE: "رشتہ ہٹا",
  MARRIAGE_ADD: "شادی درج ہوئی",
  MARRIAGE_UPDATE: "شادی بدلی",
  MARRIAGE_REMOVE: "شادی ہٹی",
  SIBLING_REORDER: "بہن بھائیوں کی ترتیب بدلی",
  DUPLICATE_MERGE: "ڈپلیکیٹ ملائے گئے",
  DUPLICATE_SKIP: "ڈپلیکیٹ چھوڑے گئے",
  TREE_MERGE: "درخت ملائے گئے",
  IMPORT: "امپورٹ ہوا",
  UNDO: "تبدیلی واپس ہوئی",
};

export function VersionHistory({ treeId }: VersionHistoryProps) {
  const [items, setItems] = useState<VersionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string | null) => {
      if (cursor === undefined) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const url = `/api/tree/${treeId}/history${cursor ? `?cursor=${cursor}` : ""}`;
        const res = await fetch(url);
        const j = await res.json().catch(() => null);
        if (!res.ok) throw new Error(j?.error || "تاریخچہ لوڈ نہیں ہوا");
        setItems((prev) => (cursor ? [...prev, ...(j.items ?? [])] : j.items ?? []));
        setNextCursor(j.nextCursor ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [treeId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const undo = async (versionId: string) => {
    setUndoingId(versionId);
    try {
      const res = await fetch(`/api/tree/${treeId}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "واپس نہیں ہو سکی");
      toast.success(j?.message || "تبدیلی واپس کر دی گئی");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setUndoingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => load()}>
          دوبارہ کوشش کریں
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <History className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">Koi data nahi mila — ابھی کوئی تبدیلی نہیں ہوئی</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative ml-2 space-y-3 border-l-2 border-emerald-100 pl-4">
        {items.map((v) => (
          <div key={v.id} className="relative rounded-xl border bg-white p-3">
            <span className="absolute -left-[25px] top-4 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-50" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {ACTION_LABELS[v.action] ?? v.action}
                </p>
                <p className="text-xs text-gray-400">
                  {v.user?.name ?? v.user?.email ?? "نامعلوم"} ·{" "}
                  {new Date(v.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={undoingId === v.id}
                onClick={() => undo(v.id)}
              >
                {undoingId === v.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                )}
                Undo
              </Button>
            </div>
          </div>
        ))}
      </div>

      {nextCursor && (
        <div className="text-center">
          <Button variant="ghost" size="sm" disabled={loadingMore} onClick={() => load(nextCursor)}>
            {loadingMore && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
            مزید دیکھیں
          </Button>
        </div>
      )}
    </div>
  );
}
