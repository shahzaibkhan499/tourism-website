"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTreeStore } from "@/stores/tree-store";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeViewerApi } from "@/components/tree/tree-viewer";
import { fullName } from "@/lib/tree-utils";

// ============================================================
// TREE SEARCH — debounced member search, dropdown results,
// prev/next navigation, Enter/arrows keyboard support.
// ============================================================

interface TreeSearchProps {
  graph: TreeGraphData;
  open: boolean;
  onClose: () => void;
  viewerApi: React.RefObject<TreeViewerApi | null>;
}

export function TreeSearch({ graph, open, onClose, viewerApi }: TreeSearchProps) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setSearchMatches = useTreeStore((s) => s.setSearchMatches);
  const setSearchQuery = useTreeStore((s) => s.setSearchQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    if (!debounced.trim()) return [];
    const needle = debounced.trim().toLowerCase();
    return graph.members
      .filter(
        (m) =>
          m.firstName.toLowerCase().includes(needle) ||
          m.lastName.toLowerCase().includes(needle) ||
          (m.nickName ?? "").toLowerCase().includes(needle) ||
          (m.currentCity ?? "").toLowerCase().includes(needle)
      )
      .slice(0, 30)
      .map((m) => m.id);
  }, [debounced, graph.members]);

  useEffect(() => {
    setSearchQuery(debounced);
    setSearchMatches(results.map((memberId, index) => ({ memberId, index, total: results.length })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, debounced]);

  const goTo = (memberId: string) => {
    viewerApi.current?.centerOn(memberId);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="absolute left-3 top-3 z-20 w-72 rounded-xl border bg-white p-2 shadow-lg">
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ممبر تلاش کریں... (Ctrl+F)"
          className="h-8 border-0 px-1 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} aria-label="Close search">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {results.length > 0 && (
        <>
          <div className="mt-1 max-h-64 overflow-y-auto border-t pt-1">
            {results.map((id, i) => {
              const m = graph.memberById.get(id);
              if (!m) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goTo(id)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-emerald-50"
                >
                  <span>
                    {fullName(m)}
                    <span className="ml-2 text-xs text-gray-400">جنریشن {m.generation}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {i + 1}/{results.length}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-1 flex items-center justify-between border-t pt-1">
            <span className="text-xs text-gray-500">
              {results.length} ممبر ملے
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => goTo(results[Math.max(0, results.indexOf(selectedOrFirst()) - 1)])}
                aria-label="Previous match"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => goTo(results[Math.min(results.length - 1, results.indexOf(selectedOrFirst()) + 1)])}
                aria-label="Next match"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
      {debounced.trim() && results.length === 0 && (
        <p className="border-t px-2 py-2 text-xs text-gray-500">Koi data nahi mila</p>
      )}
    </div>
  );

  function selectedOrFirst(): string {
    const sel = useTreeStore.getState().selectedMemberId;
    if (sel && results.includes(sel)) return sel;
    return results[0] ?? "";
  }
}
