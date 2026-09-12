"use client";

import { memo } from "react";
import { MARRIAGE_COLOR } from "@/lib/tree-utils";
import type { PlacedMarriageLine } from "@/lib/tree-layout";

// ============================================================
// TREE MARRIAGE LINK — horizontal (TB) / vertical (LR) DOUBLE
// line between spouses, edge-to-edge (right edge of left node
// -> left edge of right node). 2px per line, 6px gap, always
// PERPENDICULAR to the line direction.
//   MARRIED / ENGAGED: double pink #ec4899 (engaged dashed)
//   DIVORCED / SEPARATED: double dashed gray #9ca3af + red ✕
//   WIDOWED: double solid gray
// ============================================================

interface TreeMarriageLinkProps {
  line: PlacedMarriageLine;
  dark?: boolean;
}

function TreeMarriageLinkInner({ line, dark = false }: TreeMarriageLinkProps) {
  const len = Math.abs(line.x2 - line.x1) + Math.abs(line.y2 - line.y1);
  if (len < 2) return null;

  const horizontal = Math.abs(line.x2 - line.x1) >= Math.abs(line.y2 - line.y1);
  const x1 = Math.min(line.x1, line.x2);
  const x2 = Math.max(line.x1, line.x2);
  const y1 = Math.min(line.y1, line.y2);
  const y2 = Math.max(line.y1, line.y2);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const isDivorced = line.status === "DIVORCED" || line.status === "SEPARATED";
  const isEngaged = line.status === "ENGAGED";
  const isWidowed = line.status === "WIDOWED";
  const color = isDivorced || isWidowed ? "#9ca3af" : MARRIAGE_COLOR;
  const dash = isDivorced || isEngaged ? "5,4" : undefined;
  const casing = dark ? "#030712" : "#ffffff";

  // two parallel lines, 6px apart (3px either side of the center line)
  const lines = horizontal
    ? [
        { x1, y1: y1 - 3, x2, y2: y2 - 3 },
        { x1, y1: y1 + 3, x2, y2: y2 + 3 },
      ]
    : [
        { x1: x1 - 3, y1, x2: x2 - 3, y2 },
        { x1: x1 + 3, y1, x2: x2 + 3, y2 },
      ];

  return (
    <g>
      {/* casing for legibility */}
      {lines.map((l, i) => (
        <line
          key={`c${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={casing}
          strokeWidth={4.5}
          opacity={0.9}
        />
      ))}
      {lines.map((l, i) => (
        <line
          key={`l${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={dash}
        />
      ))}

      {isDivorced && (
        <g transform={`translate(${midX} ${midY})`}>
          <circle cx={0} cy={0} r={10} fill={casing} opacity={0.9} />
          <line x1={-5} y1={-5} x2={5} y2={5} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={-5} y1={5} x2={5} y2={-5} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      )}
      {isEngaged && (
        <text x={midX} y={horizontal ? midY - 10 : midY - 6} fontSize={11} textAnchor="middle">
          💍
        </text>
      )}
    </g>
  );
}

export const TreeMarriageLink = memo(TreeMarriageLinkInner);
