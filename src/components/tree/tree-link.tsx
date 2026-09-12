"use client";

import { memo } from "react";
import { REL_TYPE_META } from "@/lib/tree-utils";
import type { PlacedBus } from "@/lib/tree-layout";

// ============================================================
// TREE LINK — parent-child connector buses, edge-to-edge.
// Biological: solid green #16a34a; adopted: dashed blue;
// step: dotted orange; guardian/foster: their own dashes.
// Includes the sibling connector (horizontal run above the
// children row).
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
      {/* thin light casing so lines stay legible over the dot grid */}
      <path
        d={d}
        fill="none"
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
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
