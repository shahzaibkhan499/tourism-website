"use client";

import { useMemo } from "react";
import { HeartHandshake, Users } from "lucide-react";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeDto } from "@/types/tree";
import { isDeceased } from "@/lib/tree-utils";

// ============================================================
// TREE STATS — compact stat chips above the viewer.
// ============================================================

interface TreeStatsProps {
  tree: TreeDto;
  graph: TreeGraphData;
}

export function TreeStats({ tree, graph }: TreeStatsProps) {
  const stats = useMemo(() => {
    const members = graph.members;
    const males = members.filter((m) => m.gender === "MALE").length;
    const females = members.length - males;
    const living = members.filter((m) => !isDeceased(m)).length;
    const deceased = members.length - living;
    const generations = Math.max(...members.map((m) => m.generation), 1);
    return { total: members.length, males, females, living, deceased, generations };
  }, [graph.members]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
        <Users className="h-3.5 w-3.5" />
        {stats.total} ممبرز
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 ring-1 ring-blue-200">
        مرد: {stats.males}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-700 ring-1 ring-pink-200">
        خواتین: {stats.females}
      </span>
      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200">
        زندہ: {stats.living}
      </span>
      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200">
        فوت شدہ: {stats.deceased}
      </span>
      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200">
        نسلیں: {stats.generations}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-700 ring-1 ring-pink-200">
        <HeartHandshake className="h-3.5 w-3.5" />
        شادیاں: {graph.marriageById.size}
      </span>
    </div>
  );
}
