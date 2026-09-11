"use client";

import { memo } from "react";
import { MARRIAGE_STATUS_META, MARRIAGE_COLOR } from "@/lib/tree-utils";
import type { PlacedMarriageLine } from "@/lib/tree-layout";

// ============================================================
// TREE MARRIAGE LINK — double horizontal line between spouses.
// Active: double solid pink (1.5px each); divorced: gray + ✗;
// engaged: double dashed light pink; widowed/separated: gray.
// ============================================================

interface TreeMarriageLinkProps {
  line: PlacedMarriageLine;
}

function TreeMarriageLinkInner({ line }: TreeMarriageLinkProps) {
  const meta = MARRIAGE_STATUS_META[line.status] ?? MARRIAGE_STATUS_META.MARRIED;
  const color = meta.color ?? MARRIAGE_COLOR;
  const len = Math.abs(line.x2 - line.x1);
  const x1 = Math.min(line.x1, line.x2);
  const y1 = line.y1;
  const dashed = line.status === "ENGAGED";
  const midX = (line.x1 + line.x2) / 2;
  const midY = line.y1;

  if (len < 2) return null;

  return (
    <g>
      <line x1={x1} y1={y1 - 3} x2={x1 + len} y2={y1 - 3} stroke="#ffffff" strokeWidth={4} />
      <line x1={x1} y1={y1 + 3} x2={x1 + len} y2={y1 + 3} stroke="#ffffff" strokeWidth={4} />
      <line
        x1={x1}
        y1={y1 - 3}
        x2={x1 + len}
        y2={y1 - 3}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5,3" : undefined}
      />
      <line
        x1={x1}
        y1={y1 + 3}
        x2={x1 + len}
        y2={y1 + 3}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5,3" : undefined}
      />

      {(line.status === "DIVORCED" || line.status === "SEPARATED") && (
        <g transform={`translate(${midX} ${midY})`}>
          <line x1={-5} y1={-5} x2={5} y2={5} stroke="#6b7280" strokeWidth={2} strokeLinecap="round" />
          <line x1={-5} y1={5} x2={5} y2={-5} stroke="#6b7280" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {line.status === "ENGAGED" && (
        <text x={midX} y={midY - 8} fontSize={11} fill="#db2777" textAnchor="middle">
          💍
        </text>
      )}
    </g>
  );
}

export const TreeMarriageLink = memo(TreeMarriageLinkInner);
