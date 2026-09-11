"use client";

import { memo } from "react";
import { DECEASED_COLOR, GENDER_COLORS, NODE_H, NODE_W, SELECTED_COLOR, formatDate, fullName, initials, isDeceased } from "@/lib/tree-utils";
import { TREE_THEME } from "@/components/tree/use-dark-mode";
import type { TreeMemberDto } from "@/types/tree";

// ============================================================
// TREE NODE — SVG node per spec:
// 180x90, 3px gender border, rounded 12, white bg; deceased =
// gray + diagonal stripe + 🕯️; selected = green + ring + scale;
// photo circle 40x40 (initials fallback), name bold 14px,
// dates gray 12px, generation badge 20x20 top-right.
// ============================================================

interface TreeNodeProps {
  member: TreeMemberDto;
  cx: number;
  cy: number;
  selected: boolean;
  hovered: boolean;
  searchMatch: boolean;
  showNames: boolean;
  showPhotos: boolean;
  showDates: boolean;
  dimmed: boolean;
  dark?: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

function TreeNodeInner({
  member,
  cx,
  cy,
  selected,
  hovered,
  searchMatch,
  showNames,
  showPhotos,
  showDates,
  dimmed,
  dark = false,
  onSelect,
  onHover,
  onContextMenu,
}: TreeNodeProps) {
  const deceased = isDeceased(member);
  const theme = dark ? TREE_THEME.dark : TREE_THEME.light;
  const border = deceased ? DECEASED_COLOR : selected ? SELECTED_COLOR : GENDER_COLORS[member.gender] ?? "#6b7280";
  const x = cx - NODE_W / 2;
  const y = cy - NODE_H / 2;
  const scale = selected ? 1.03 : hovered ? 1.03 : 1;
  const dates =
    showDates && (member.dateOfBirth || member.dateOfDeath)
      ? `${member.dateOfBirth ? "b." + formatDate(member.dateOfBirth) : ""}${member.dateOfDeath ? " – d." + formatDate(member.dateOfDeath) : ""}`
      : "";
  const name = showNames ? fullName(member) : member.gender === "MALE" ? "مرد" : "خاتون";

  return (
    <g
      transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
      className="cursor-pointer"
      opacity={dimmed ? 0.35 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(member.id);
      }}
      onMouseEnter={() => onHover(member.id)}
      onMouseLeave={() => onHover(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, member.id);
      }}
    >
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={12}
        ry={12}
        fill={theme.nodeFill}
        stroke={border}
        strokeWidth={3}
        style={{
          filter: selected
            ? "drop-shadow(0 4px 10px rgba(22,163,74,0.35))"
            : hovered
              ? "drop-shadow(0 3px 6px rgba(0,0,0,0.12))"
              : "drop-shadow(0 1px 2px rgba(0,0,0,0.08))",
        }}
      />
      {selected && (
        <rect
          x={x - 4}
          y={y - 4}
          width={NODE_W + 8}
          height={NODE_H + 8}
          rx={14}
          ry={14}
          fill="none"
          stroke={SELECTED_COLOR}
          strokeWidth={2.5}
          opacity={0.55}
        />
      )}
      {deceased && (
        <>
          <line x1={x + 4} y1={y + NODE_H - 6} x2={x + 62} y2={y + NODE_H - 6} stroke="#cbd5e1" strokeWidth={3} />
          <line x1={x + 2} y1={y + 10} x2={x + 88} y2={y + 30} stroke="#e5e7eb" strokeWidth={8} opacity={0.6} />
          <text x={x + NODE_W - 16} y={y + NODE_H - 10} fontSize={13} textAnchor="middle">
            🕯️
          </text>
        </>
      )}

      {/* photo circle (40x40) or initials */}
      {showPhotos && member.photo ? (
        <>
          <clipPath id={`node-clip-${member.id}`}>
            <circle cx={x + 30} cy={y + 28} r={20} />
          </clipPath>
          <image
            href={member.photo}
            x={x + 10}
            y={y + 8}
            width={40}
            height={40}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#node-clip-${member.id})`}
          />
          <circle cx={x + 30} cy={y + 28} r={20} fill="none" stroke={border} strokeWidth={1.5} />
        </>
      ) : (
        <>
          <circle cx={x + 30} cy={y + 28} r={20} fill={deceased ? theme.deceasedCircle : GENDER_COLORS[member.gender] + "1a"} />
          <circle cx={x + 30} cy={y + 28} r={20} fill="none" stroke={border} strokeWidth={1.5} />
          <text
            x={x + 30}
            y={y + 33}
            fontSize={13}
            fontWeight={700}
            textAnchor="middle"
            fill={deceased ? "#6b7280" : GENDER_COLORS[member.gender]}
          >
            {initials(member)}
          </text>
        </>
      )}

      {/* name */}
      <text
        x={x + 58}
        y={y + 30}
        fontSize={14}
        fontWeight={700}
        fill="#111827"
        style={{ fontFamily: "inherit" }}
      >
        {name.length > 16 ? name.slice(0, 15) + "…" : name}
      </text>

      {/* dates */}
      {dates && (
        <text x={x + 58} y={y + 48} fontSize={12} fill={theme.dateFill}>
          {dates.length > 30 ? dates.slice(0, 29) + "…" : dates}
        </text>
      )}
      {!dates && member.birthPlace && (
        <text x={x + 58} y={y + 48} fontSize={12} fill="#9ca3af">
          {member.birthPlace.slice(0, 22)}
        </text>
      )}

      {/* generation badge */}
      <circle cx={x + NODE_W - 14} cy={y + 14} r={10} fill={deceased ? "#9ca3af" : theme.genBadgeFill} />
      <text x={x + NODE_W - 14} y={y + 18} fontSize={10} fontWeight={700} textAnchor="middle" fill={theme.genBadgeText}>
        {member.generation}
      </text>

      {/* search match ring */}
      {searchMatch && (
        <rect x={x - 8} y={y - 8} width={NODE_W + 16} height={NODE_H + 16} rx={16} fill="none" stroke="#f59e0b" strokeWidth={3} strokeDasharray="8,4" />
      )}
    </g>
  );
}

export const TreeNode = memo(TreeNodeInner);
