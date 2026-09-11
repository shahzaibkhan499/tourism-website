"use client";

import { memo } from "react";
import { REL_TYPE_META } from "@/lib/tree-utils";
import type { PlacedBus } from "@/lib/tree-layout";

// ============================================================
// TREE LINK — parent-child connector buses.
// Biological: solid green; adopted: dashed blue; step: dotted
// orange; guardian/foster: their own dashes (per spec).
// ============================================================

interface TreeLinkProps {
  bus: PlacedBus;
}

function TreeLinkInner({ bus }: TreeLinkProps) {
  const meta = REL_TYPE_META[bus.type] ?? REL_TYPE_META.BIOLOGICAL;
  const d =
    bus.points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ") || "";
  if (!d) return null;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d={d}
        fill="none"
        stroke={meta.stroke}
        strokeWidth={2}
        strokeDasharray={meta.dash || undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

export const TreeLink = memo(TreeLinkInner);
