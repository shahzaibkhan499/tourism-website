"use client";

import { useMemo, useRef } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { DECEASED_COLOR, GENDER_COLORS, SELECTED_COLOR } from "@/lib/tree-utils";
import type { TreeLayoutResult } from "@/lib/tree-layout";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeViewerApi } from "@/components/tree/tree-viewer";

// ============================================================
// TREE MINIMAP — bottom-left 200x150 overview with draggable
// viewport rectangle. Drag = pan main view.
// ============================================================

interface TreeMinimapProps {
  layout: TreeLayoutResult;
  graph: TreeGraphData;
  viewport: { x: number; y: number; k: number; width: number; height: number } | null;
  viewerApi: React.RefObject<TreeViewerApi | null>;
}

const MM_W = 200;
const MM_H = 150;
const MM_PAD = 12;

export function TreeMinimap({ layout, graph, viewport, viewerApi }: TreeMinimapProps) {
  const showMinimap = useTreeStore((s) => s.showMinimap);
  const selectedId = useTreeStore((s) => s.selectedMemberId);
  const dragging = useRef(false);

  const { bounds } = layout;
  const scale = useMemo(
    () => Math.min((MM_W - MM_PAD * 2) / Math.max(bounds.width, 1), (MM_H - MM_PAD * 2) / Math.max(bounds.height, 1)),
    [bounds.width, bounds.height]
  );

  if (!showMinimap) return null;

  const toMini = (x: number, y: number) => ({
    x: MM_PAD + x * scale,
    y: MM_PAD + y * scale,
  });

  const viewportRect = viewport && viewport.k > 0
    ? {
        x: -viewport.x / viewport.k,
        y: -viewport.y / viewport.k,
        w: viewport.width / viewport.k,
        h: viewport.height / viewport.k,
      }
    : null;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const wx = (px - MM_PAD) / scale;
    const wy = (py - MM_PAD) / scale;
    const v = viewport;
    if (!v) return;
    const targetK = v.k;
    viewerApi.current?.setViewport(v.width / 2 - wx * targetK, v.height / 2 - wy * targetK, targetK);
  };

  const handleDown = (e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    handlePointer(e);
  };

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const wx = (px - MM_PAD) / scale;
    const wy = (py - MM_PAD) / scale;
    const v = viewport;
    if (!v) return;
    viewerApi.current?.setViewport(v.width / 2 - wx * v.k, v.height / 2 - wy * v.k, v.k);
  };

  const handleUp = () => {
    dragging.current = false;
  };

  return (
    <div className="absolute bottom-3 left-3 z-10 overflow-hidden rounded-lg border bg-white shadow-lg">
      <svg
        width={MM_W}
        height={MM_H}
        className="cursor-crosshair touch-none"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
      >
        <rect x="0" y="0" width={MM_W} height={MM_H} fill="#fafafa" />
        <rect x={MM_PAD - 2} y={MM_PAD - 2} width={(bounds.width * scale) + 4} height={(bounds.height * scale) + 4} fill="#f1f5f9" rx="3" />
        {Array.from(layout.nodes.values()).map((n) => {
          const m = graph.memberById.get(n.id);
          if (!m) return null;
          const p = toMini(n.cx, n.cy);
          const color = selectedId === n.id ? SELECTED_COLOR : m.isAlive && !m.dateOfDeath ? GENDER_COLORS[m.gender] : DECEASED_COLOR;
          return (
            <rect
              key={n.id}
              x={p.x - 5}
              y={p.y - 3}
              width={10}
              height={6}
              rx={2}
              fill={color}
              opacity={0.85}
            />
          );
        })}
        {viewportRect && (
          <rect
            x={MM_PAD + viewportRect.x * scale}
            y={MM_PAD + viewportRect.y * scale}
            width={Math.max(viewportRect.w * scale, 8)}
            height={Math.max(viewportRect.h * scale, 8)}
            fill="none"
            stroke="#2563eb"
            strokeWidth={1.5}
            rx={2}
          />
        )}
      </svg>
    </div>
  );
}
