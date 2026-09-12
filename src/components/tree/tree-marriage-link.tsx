"use client";

import { memo } from "react";
import { MARRIAGE_COLOR } from "@/lib/tree-utils";
import type { PlacedMarriageLine } from "@/lib/tree-layout";

// ============================================================
// TREE MARRIAGE LINK — horizontal DOUBLE line between spouses,
// edge-to-edge (right edge of left node → left edge of right
// node). 2px per line, 6px gap.
//   MARRIED:  double solid pink #ec4899
//   ENGAGED:  double dashed pink
//   DIVORCED / SEPARATED: double dashed gray #9ca3af + red ✕
//   WIDOWED:  double solid gray
// ============================================================

interface TreeMarriageLinkProps {
  line: PlacedMarriageLine;
}

function TreeMarriageLinkInner({ line }: TreeMarriageLinkProps) {
  const len = Math.abs(line.x2 - line.x1);
  const x1 = Math.min(line.x1, line.x2);
  const x2 = Math.max(line.x1, line.x2);
  const y = line.y1;
  const midX = (x1 + x2) / 2;

  if (len < 2) return null;

  const isDivorced = line.status === "DIVORCED" || line.status === "SEPARATED";
  const isEngaged = line.status === "ENGAGED";
  const isWidowed = line.status === "WIDOWED";
  const color = isDivorced || isWidowed ? "#9ca3af" : MARRIAGE_COLOR;
  const dash = isDivorced || isEngaged ? "5,4" : undefined;

  return (
    <g>
      {/* casing for legibility */}
      <line x1={x1} y1={y - 3} x2={x2} y2={y - 3} stroke="#ffffff" strokeWidth={4.5} opacity={0.85} />
      <line x1={x1} y1={y + 3} x2={x2} y2={y + 3} stroke="#ffffff" strokeWidth={4.5} opacity={0.85} />
      <line x1={x1} y1={y - 3} x2={x2} y2={y - 3} stroke={color} strokeWidth={2} strokeDasharray={dash} />
      <line x1={x1} y1={y + 3} x2={x2} y2={y + 3} stroke={color} strokeWidth={2} strokeDasharray={dash} />

      {isDivorced && (
        <g transform={`translate(${midX} ${y})`}>
          <circle cx={0} cy={0} r={10} fill="#ffffff" opacity={0.9} />
          <line x1={-5} y1={-5} x2={5} y2={5} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={-5} y1={5} x2={5} y2={-5} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )}
      {isEngaged && (
        <text x={midX} y={y - 10} fontSize={11} textAnchor="middle">
          💍
        </text>
      )}
    </g>
  );
}

export const TreeMarriageLink = memo(TreeMarriageLinkInner);
