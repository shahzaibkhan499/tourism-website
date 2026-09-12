"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as d3 from "d3";
import { useTreeStore } from "@/stores/tree-store";
import { buildTreeGraph } from "@/lib/tree-graph";
import { layoutTree } from "@/lib/tree-layout";
import type { TreeLayoutResult } from "@/lib/tree-layout";
import type { TreeGraphData } from "@/lib/tree-graph";
import { DECEASED_COLOR, GENDER_COLORS, NODE_H, NODE_W, REL_TYPE_META, SELECTED_COLOR, fullName } from "@/lib/tree-utils";
import { TREE_THEME, useDarkMode } from "@/components/tree/use-dark-mode";

// ============================================================
// CANVAS TREE VIEWER — Step 39: Canvas renderer for 1000+
// member trees. LOD zoom levels (boxes → names → full detail),
// d3 zoom/pan/pinch, hit-testing for click/hover selection.
// Layout computed in a Web Worker (Step 43) for big graphs.
// ============================================================

export interface CanvasViewerApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  fit: () => void;
  centerOn: (memberId: string) => void;
  setViewport: (x: number, y: number, k: number) => void;
}

interface CanvasTreeViewerProps {
  members: ReturnType<typeof buildTreeGraph>["members"];
  relationships: Parameters<typeof buildTreeGraph>[1];
  marriages: Parameters<typeof buildTreeGraph>[2];
  rootId: string | null;
  onContextMenu: (e: React.MouseEvent, memberId: string) => void;
}

const PAD = 60;

export const CanvasTreeViewer = forwardRef<CanvasViewerApi, CanvasTreeViewerProps>(function CanvasTreeViewer(
  { members, relationships, marriages, rootId, onContextMenu },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const viewRef = useRef({ x: 0, y: 0, k: 1 });
  const layoutRef = useRef<TreeLayoutResult | null>(null);
  const graphRef = useRef<TreeGraphData | null>(null);
  const [layout, setLayout] = useState<TreeLayoutResult | null>(null);
  const [busy, setBusy] = useState(true);
  const dark = useDarkMode();

  const direction = useTreeStore((s) => s.direction);
  const malesFirst = useTreeStore((s) => s.malesFirst);
  const selectedId = useTreeStore((s) => s.selectedMemberId);
  const setSelected = useTreeStore((s) => s.setSelectedMember);

  // sync layout (main thread fallback; worker for heavy graphs)
  useEffect(() => {
    setBusy(true);
    const graph = buildTreeGraph(members, relationships, marriages);
    graphRef.current = graph;
    const doLayout = () => {
      const result = layoutTree(graph, { rootId, malesFirst, direction });
      layoutRef.current = result;
      setLayout(result);
      setBusy(false);
    };
    if (members.length >= 1000 && typeof Worker !== "undefined") {
      try {
        const worker = new Worker(new URL("@/lib/tree-layout.worker.ts", import.meta.url));
        worker.onmessage = (event: MessageEvent<{ ok: boolean; layout?: TreeLayoutResult }>) => {
          if (event.data.ok && event.data.layout) {
            layoutRef.current = event.data.layout;
            setLayout(event.data.layout);
          } else {
            doLayout();
          }
          setBusy(false);
          worker.terminate();
        };
        worker.onerror = () => {
          doLayout();
          setBusy(false);
          worker.terminate();
        };
        worker.postMessage({ members, relationships, marriages, rootId, malesFirst, direction });
        return () => worker.terminate();
      } catch {
        doLayout();
      }
    } else {
      doLayout();
    }
  }, [members, relationships, marriages, rootId, malesFirst, direction]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const lay = layoutRef.current;
    const graph = graphRef.current;
    if (!canvas || !wrap || !lay || !graph) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const theme = dark ? TREE_THEME.dark : TREE_THEME.light;
    const v = viewRef.current;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = theme.canvasBg;
    ctx.fillRect(0, 0, cw, ch);
    // dot grid
    ctx.fillStyle = theme.dot;
    const spacing = 20 * v.k;
    if (spacing >= 4) {
      const startX = ((v.x % spacing) + spacing) % spacing;
      const startY = ((v.y % spacing) + spacing) % spacing;
      for (let gx = startX; gx < cw; gx += spacing) {
        for (let gy = startY; gy < ch; gy += spacing) {
          ctx.fillRect(gx, gy, 1, 1);
        }
      }
    }

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.k, v.k);

    const casing = dark ? "#030712" : "#ffffff";

    // buses (casing pass + colored pass)
    for (const b of lay.buses) {
      const meta = REL_TYPE_META[b.type] ?? REL_TYPE_META.BIOLOGICAL;
      const dash = meta.dash ? meta.dash.split(",").map(Number).map((n) => n / v.k) : [];
      const passes: Array<{ stroke: string; width: number }> = [
        { stroke: casing, width: 4.5 / v.k },
        { stroke: meta.stroke, width: 2 / v.k },
      ];
      for (const pass of passes) {
        ctx.beginPath();
        b.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = pass.stroke;
        ctx.lineWidth = pass.width;
        ctx.setLineDash(dash);
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // marriages (double lines 6px apart, perpendicular to direction)
    for (const m of lay.marriages) {
      const horizontal = Math.abs(m.x2 - m.x1) >= Math.abs(m.y2 - m.y1);
      const isDivorced = m.status === "DIVORCED" || m.status === "SEPARATED";
      const isEngaged = m.status === "ENGAGED";
      const isWidowed = m.status === "WIDOWED";
      const color = isDivorced || isWidowed ? "#9ca3af" : "#ec4899";
      const dash = isDivorced || isEngaged ? [5 / v.k, 4 / v.k] : [];
      const x1 = Math.min(m.x1, m.x2);
      const x2 = Math.max(m.x1, m.x2);
      const y1 = Math.min(m.y1, m.y2);
      const y2 = Math.max(m.y1, m.y2);
      const pairs = horizontal
        ? [
            [x1, y1 - 3, x2, y2 - 3],
            [x1, y1 + 3, x2, y2 + 3],
          ]
        : [
            [x1 - 3, y1, x2 - 3, y2],
            [x1 + 3, y1, x2 + 3, y2],
          ];
      const mPasses: Array<{ stroke: string; width: number }> = [
        { stroke: casing, width: 4.5 / v.k },
        { stroke: color, width: 2 / v.k },
      ];
      for (const pass of mPasses) {
        ctx.beginPath();
        for (const [ax, ay, bx, by] of pairs) {
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
        }
        ctx.strokeStyle = pass.stroke;
        ctx.lineWidth = pass.width;
        ctx.setLineDash(dash);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (isDivorced) {
        const mx = (m.x1 + m.x2) / 2;
        const my = (m.y1 + m.y2) / 2;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2.5 / v.k;
        ctx.beginPath();
        ctx.moveTo(mx - 5, my - 5);
        ctx.lineTo(mx + 5, my + 5);
        ctx.moveTo(mx - 5, my + 5);
        ctx.lineTo(mx + 5, my - 5);
        ctx.stroke();
      }
      if (isEngaged) {
        ctx.font = `${11 / v.k}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("💍", (m.x1 + m.x2) / 2, horizontal ? (m.y1 + m.y2) / 2 - 10 / v.k : (m.y1 + m.y2) / 2 - 4 / v.k);
      }
    }

    // nodes with LOD
    for (const n of Array.from(lay.nodes.values())) {
      const member = graph.memberById.get(n.id);
      if (!member) continue;
      const deceased = !member.isAlive || Boolean(member.dateOfDeath);
      const border = deceased
        ? DECEASED_COLOR
        : selectedId === n.id
          ? SELECTED_COLOR
          : GENDER_COLORS[member.gender] ?? "#6b7280";
      const x = n.cx - NODE_W / 2;
      const y = n.cy - NODE_H / 2;

      ctx.beginPath();
      ctx.roundRect(x, y, NODE_W, NODE_H, 12);
      ctx.fillStyle = theme.nodeFill;
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = (selectedId === n.id ? 4 : 3) / v.k;
      ctx.stroke();

      if (v.k >= 0.5) {
        // photo / initials
        ctx.beginPath();
        ctx.arc(n.cx - NODE_W / 2 + 30, n.cy - NODE_H / 2 + 28, 20, 0, Math.PI * 2);
        ctx.fillStyle = deceased ? theme.deceasedCircle : (GENDER_COLORS[member.gender] ?? "#6b7280") + "1a";
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5 / v.k;
        ctx.stroke();
        ctx.fillStyle = border;
        ctx.font = `bold ${13 / v.k}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${(member.firstName[0] ?? "").toUpperCase()}${(member.lastName[0] ?? "").toUpperCase()}`, n.cx - NODE_W / 2 + 30, n.cy - NODE_H / 2 + 28);
      }
      if (v.k >= 0.6) {
        // name + dates + gen badge
        ctx.fillStyle = theme.nameFill;
        ctx.font = `bold ${14 / v.k}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const nm = fullName(member).slice(0, 16);
        ctx.fillText(nm, n.cx - NODE_W / 2 + 58, n.cy - NODE_H / 2 + 30);
        const dates = member.dateOfBirth
          ? `${new Date(member.dateOfBirth).getFullYear()}${member.dateOfDeath ? "–" + new Date(member.dateOfDeath).getFullYear() : ""}`
          : "";
        if (dates) {
          ctx.fillStyle = theme.dateFill;
          ctx.font = `${12 / v.k}px sans-serif`;
          ctx.fillText(dates, n.cx - NODE_W / 2 + 58, n.cy - NODE_H / 2 + 48);
        }
        ctx.beginPath();
        ctx.arc(n.cx + NODE_W / 2 - 14, n.cy - NODE_H / 2 + 14, 10, 0, Math.PI * 2);
        ctx.fillStyle = deceased ? "#9ca3af" : theme.genBadgeFill;
        ctx.fill();
        ctx.fillStyle = theme.genBadgeText;
        ctx.font = `bold ${10 / v.k}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(String(member.generation), n.cx + NODE_W / 2 - 14, n.cy - NODE_H / 2 + 14);
      }
      if (deceased && v.k >= 0.5) {
        ctx.fillStyle = "#6b7280";
        ctx.font = `${13 / v.k}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🕯️", n.cx + NODE_W / 2 - 16, n.cy + NODE_H / 2 - 10);
      }
    }
    ctx.restore();
  }, [dark, selectedId]);

  // d3 zoom on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        viewRef.current = { x: event.transform.x, y: event.transform.y, k: event.transform.k };
        draw();
      });
    zoomRef.current = zoom;
    d3.select(canvas).call(zoom).on("dblclick.zoom", null);
    return () => {
      d3.select(canvas).on(".zoom", null);
    };
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw, layout]);

  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const zoom = zoomRef.current;
    const lay = layoutRef.current;
    if (!canvas || !wrap || !zoom || !lay) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const k = Math.min(cw / (lay.bounds.width + PAD * 2), ch / (lay.bounds.height + PAD * 2), 1);
    const tx = (cw - lay.bounds.width * k) / 2;
    const ty = (ch - lay.bounds.height * k) / 2;
    viewRef.current = { x: tx, y: ty, k };
    d3.select(canvas).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
  }, []);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const canvas = canvasRef.current;
      if (canvas && zoomRef.current) d3.select(canvas).transition().duration(200).call(zoomRef.current.scaleBy, 1.3);
    },
    zoomOut: () => {
      const canvas = canvasRef.current;
      if (canvas && zoomRef.current) d3.select(canvas).transition().duration(200).call(zoomRef.current.scaleBy, 0.75);
    },
    reset: () => fit(),
    fit,
    centerOn: (memberId: string) => {
      const canvas = canvasRef.current;
      const node = layoutRef.current?.nodes.get(memberId);
      if (!canvas || !zoomRef.current || !node) return;
      const wrap = wrapRef.current;
      const v = viewRef.current;
      const k = Math.max(v.k, 1.3);
      const tx = (wrap?.clientWidth ?? 800) / 2 - node.cx * k;
      const ty = (wrap?.clientHeight ?? 600) / 2 - node.cy * k;
      viewRef.current = { x: tx, y: ty, k };
      d3.select(canvas).transition().duration(450).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
      setSelected(memberId);
    },
    setViewport: (x: number, y: number, k: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      viewRef.current = { x, y, k };
      d3.select(canvas).call(zoomRef.current.transform, d3.zoomIdentity.translate(x, y).scale(k));
    },
  }));

  useEffect(() => {
    fit();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fit]);

  const hitTest = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    const lay = layoutRef.current;
    if (!canvas || !lay) return null;
    const rect = canvas.getBoundingClientRect();
    const v = viewRef.current;
    const wx = (clientX - rect.left - v.x) / v.k;
    const wy = (clientY - rect.top - v.y) / v.k;
    for (const n of Array.from(lay.nodes.values())) {
      if (Math.abs(wx - n.cx) <= NODE_W / 2 && Math.abs(wy - n.cy) <= NODE_H / 2) return n.id;
    }
    return null;
  };

  return (
    <div ref={wrapRef} className="relative h-[72vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-[#fafafa] dark:border-gray-800 dark:bg-[#030712]">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        onClick={(e) => {
          const id = hitTest(e.clientX, e.clientY);
          setSelected(id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const id = hitTest(e.clientX, e.clientY);
          if (id) onContextMenu(e, id);
        }}
      />
      {busy && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/40">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">شجرہ تیار ہو رہا ہے...</p>
        </div>
      )}
      <div className="absolute bottom-3 right-3 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800">
        بڑا شجرہ — Canvas موڈ میں تیز رینڈرنگ
      </div>
    </div>
  );
});
