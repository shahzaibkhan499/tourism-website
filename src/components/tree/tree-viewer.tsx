"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useTreeStore } from "@/stores/tree-store";
import { layoutTree } from "@/lib/tree-layout";
import type { TreeLayoutResult } from "@/lib/tree-layout";
import type { TreeGraphData } from "@/lib/tree-graph";
import { DOT_GRID_COLOR } from "@/lib/tree-utils";
import { TREE_THEME, useDarkMode } from "@/components/tree/use-dark-mode";
import { TreeNode } from "@/components/tree/tree-node";
import { TreeLink } from "@/components/tree/tree-link";
import { TreeMarriageLink } from "@/components/tree/tree-marriage-link";

// ============================================================
// TREE VIEWER — SVG canvas with d3 zoom/pan (mouse wheel,
// drag, two-finger touch pinch), dot-grid background, direction
// switching, keyboard shortcuts, search highlighting.
// Renders < 200 members fully (SVG tier); larger trees capped
// by 5-generation lazy depth (expand via generation filter).
// ============================================================

export interface TreeViewerApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fit: () => void;
  centerOn: (memberId: string) => void;
  setViewport: (x: number, y: number, k: number) => void;
}

interface TreeViewerProps {
  graph: TreeGraphData;
  onContextMenu: (e: React.MouseEvent, memberId: string) => void;
  onViewportChange?: (v: { x: number; y: number; k: number; width: number; height: number } | null) => void;
}

interface ViewState {
  x: number;
  y: number;
  k: number;
}

const PAD = 40;

export const TreeViewer = forwardRef<TreeViewerApi, TreeViewerProps>(function TreeViewer(
  { graph, onContextMenu, onViewportChange },
  ref
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dark = useDarkMode();
  const gRef = useRef<SVGGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomRefK = useRef(1);
  const viewRef = useRef<ViewState>({ x: 0, y: 0, k: 1 });
  const [zoomK, setZoomK] = useState(1);
  const [wrapSize, setWrapSize] = useState<{ w: number; h: number }>({ w: 900, h: 600 });

  const direction = useTreeStore((s) => s.direction);
  const selectedId = useTreeStore((s) => s.selectedMemberId);
  const hoveredId = useTreeStore((s) => s.hoveredMemberId);
  const showNames = useTreeStore((s) => s.showNames);
  const showPhotos = useTreeStore((s) => s.showPhotos);
  const showDates = useTreeStore((s) => s.showDates);
  const malesFirst = useTreeStore((s) => s.malesFirst);
  const searchMatches = useTreeStore((s) => s.searchMatches);
  const setSelected = useTreeStore((s) => s.setSelectedMember);
  const setHovered = useTreeStore((s) => s.setHoveredMember);
  const setPendingNodes = useTreeStore((s) => s.setPendingNodes);

  const layout: TreeLayoutResult = useMemo(() => {
    return layoutTree(graph, {
      rootId: graph.members.length > 0 ? (graph.members.find((m) => (graph.parentIdsOf.get(m.id) ?? []).length === 0)?.id ?? null) : null,
      malesFirst,
      direction,
    });
  }, [graph, malesFirst, direction]);

  const { bounds } = layout;
  const viewW = Math.max(bounds.width + PAD * 2, 400);
  const viewH = Math.max(bounds.height + PAD * 2, 300);

  const matchIds = useMemo(() => new Set(searchMatches.map((m) => m.memberId)), [searchMatches]);
  const theme = dark ? TREE_THEME.dark : TREE_THEME.light;
  const lod = zoomK < 0.45; // LOD: hide names/dates when zoomed far out

  const fit = useCallback(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    const zoom = zoomRef.current;
    if (!svg || !wrap || !zoom) return;
    const cw = wrap.clientWidth || 900;
    const ch = wrap.clientHeight || 600;
    const k = Math.min(cw / viewW, ch / viewH, 1);
    const tx = (cw - viewW * k) / 2;
    const ty = (ch - viewH * k) / 2;
    viewRef.current = { x: tx, y: ty, k };
    d3.select(svg).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    onViewportChange?.({ x: tx, y: ty, k, width: cw, height: ch });
  }, [viewW, viewH, onViewportChange]);

  const emitViewport = useCallback(() => {
    const wrap = wrapRef.current;
    const v = viewRef.current;
    onViewportChange?.({ x: v.x, y: v.y, k: v.k, width: wrap?.clientWidth ?? 0, height: wrap?.clientHeight ?? 0 });
  }, [onViewportChange]);

  useImperativeHandle(ref, () => ({
    setViewport: (x: number, y: number, k: number) => {
      const svg = svgRef.current;
      const zoom = zoomRef.current;
      if (!svg || !zoom) return;
      viewRef.current = { x, y, k };
      d3.select(svg).call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));
      emitViewport();
    },
    zoomIn: () => {
      const svg = svgRef.current;
      const zoom = zoomRef.current;
      if (svg && zoom) d3.select(svg).transition().duration(200).call(zoom.scaleBy, 1.3);
    },
    zoomOut: () => {
      const svg = svgRef.current;
      const zoom = zoomRef.current;
      if (svg && zoom) d3.select(svg).transition().duration(200).call(zoom.scaleBy, 0.75);
    },
    reset: () => fit(),
    fit,
    centerOn: (memberId: string) => {
      const svg = svgRef.current;
      const zoom = zoomRef.current;
      const node = layout.nodes.get(memberId);
      if (!svg || !zoom || !node) return;
      const v = viewRef.current;
      const targetK = Math.max(v.k, 1.4);
      const wrap = wrapRef.current;
      const cw = wrap?.clientWidth ?? 900;
      const ch = wrap?.clientHeight ?? 600;
      const tx = cw / 2 - node.cx * targetK;
      const ty = ch / 2 - node.cy * targetK;
      viewRef.current = { x: tx, y: ty, k: targetK };
      d3.select(svg).transition().duration(450).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(targetK));
      setSelected(memberId);
      emitViewport();
    },
  }));

  // d3 zoom setup
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const t = event.transform;
        gRef.current?.setAttribute("transform", t.toString());
        viewRef.current = { x: t.x, y: t.y, k: t.k };
        if (Math.abs(t.k - zoomRefK.current) > 0.02) {
          zoomRefK.current = t.k;
          setZoomK(t.k);
        }
        emitViewport();
      })
      .on("end", () => emitViewport());
    zoomRef.current = zoom;
    d3.select(svg).call(zoom).on("dblclick.zoom", null);
    return () => {
      d3.select(svg).on(".zoom", null);
      zoomRef.current = null;
    };
  }, [emitViewport]);

  // initial fit + resize
  useEffect(() => {
    fit();
  }, [fit]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      setWrapSize({ w: wrap.clientWidth || 900, h: wrap.clientHeight || 600 });
      fit();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fit]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          refKeyApi("zoomIn");
          break;
        case "-":
          e.preventDefault();
          refKeyApi("zoomOut");
          break;
        case "r":
        case "R":
          if (!e.ctrlKey && !e.metaKey) refKeyApi("fit");
          break;
        case "b":
        case "B":
          if (!e.ctrlKey && !e.metaKey) refKeyApi("fit");
          break;
        case "n": {
          if (e.ctrlKey || e.metaKey) break;
          const matches = useTreeStore.getState().searchMatches;
          if (matches.length > 0) {
            const sel = useTreeStore.getState().selectedMemberId;
            const idx = matches.findIndex((m) => m.memberId === sel);
            const next = matches[(idx + 1) % matches.length];
            refApiCenter(next.memberId);
          }
          break;
        }
        case "p": {
          if (e.ctrlKey || e.metaKey) break;
          const matches = useTreeStore.getState().searchMatches;
          if (matches.length > 0) {
            const sel = useTreeStore.getState().selectedMemberId;
            const idx = matches.findIndex((m) => m.memberId === sel);
            const prev = matches[(idx - 1 + matches.length) % matches.length];
            refApiCenter(prev.memberId);
          }
          break;
        }
        case "Escape":
          setSelected(null);
          break;
        case "ArrowUp":
          e.preventDefault();
          panBy(0, 60);
          break;
        case "ArrowDown":
          e.preventDefault();
          panBy(0, -60);
          break;
        case "ArrowLeft":
          e.preventDefault();
          panBy(60, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          panBy(-60, 0);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refKeyApi = (method: "zoomIn" | "zoomOut" | "fit") => {
    if (typeof ref === "function" || !ref) return;
    (ref as { current: TreeViewerApi | null }).current?.[method]();
  };

  const refApiCenter = (memberId: string) => {
    if (typeof ref === "function" || !ref) return;
    (ref as { current: TreeViewerApi | null }).current?.centerOn(memberId);
  };

  const panBy = (dx: number, dy: number) => {
    const svg = svgRef.current;
    const zoom = zoomRef.current;
    if (!svg || !zoom) return;
    const v = viewRef.current;
    d3.select(svg)
      .transition()
      .duration(120)
      .call(zoom.translateBy, dx / v.k, dy / v.k);
  };

  const bgClick = () => setSelected(null);

  const searchActive = searchMatches.length > 0;

  // keep pendingNodes (for minimap / canvas tier) in sync
  useEffect(() => {
    setPendingNodes(
      Array.from(layout.nodes.values()).map((n) => ({
        member: graph.memberById.get(n.id)!,
        depth: n.depth,
        x: n.cx,
        y: n.cy,
        spouseSlot: 0,
      }))
    );
  }, [layout, graph.memberById, setPendingNodes]);

  const capReached = graph.members.length > 200;

  return (
    <div ref={wrapRef} className="relative h-[72vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-[#fafafa] dark:border-gray-800 dark:bg-[#030712]">
      <svg
        ref={svgRef}
        className="h-full w-full touch-none select-none"
        viewBox={`0 0 ${wrapSize.w} ${wrapSize.h}`}
        onClick={bgClick}
        role="img"
        aria-label="شجرہ نسب کا خاکہ"
        style={{ background: theme.canvasBg }}
      >
        <defs>
          <pattern id="tree-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={dark ? theme.dot : DOT_GRID_COLOR} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={wrapSize.w} height={wrapSize.h} fill="url(#tree-dots)" />

        <g ref={gRef}>
          {/* marriage links under buses */}
          {layout.marriages.map((m) => (
            <TreeMarriageLink key={m.id} line={m} />
          ))}
          {layout.buses.map((b) => (
            <TreeLink key={b.familyKey + b.points.length} bus={b} />
          ))}
          {Array.from(layout.nodes.values()).map((n) => {
            const member = graph.memberById.get(n.id);
            if (!member) return null;
            return (
              <TreeNode
                key={n.id}
                member={member}
                cx={n.cx}
                cy={n.cy}
                selected={selectedId === n.id}
                hovered={hoveredId === n.id}
                searchMatch={matchIds.has(n.id)}
                showNames={showNames && !lod}
                showPhotos={showPhotos}
                showDates={showDates && !lod}
                dimmed={searchActive && !matchIds.has(n.id)}
                dark={dark}
                onSelect={setSelected}
                onHover={setHovered}
                onContextMenu={onContextMenu}
              />
            );
          })}
        </g>
      </svg>

      {capReached && (
        <div className="absolute bottom-3 right-3 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 ring-1 ring-amber-200">
          بڑا شجرہ — کارکردگی کے لیے سرچ یا جنریشن فلٹر استعمال کریں
        </div>
      )}
    </div>
  );
});
