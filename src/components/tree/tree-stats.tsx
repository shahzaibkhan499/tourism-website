"use client";

import { useMemo } from "react";
import { HeartHandshake, Users } from "lucide-react";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeDto } from "@/types/tree";
import { isDeceased } from "@/lib/tree-utils";
import { T } from "@/lib/i18n";

// ============================================================
// TREE STATS — compact stat chips above the viewer.
// ============================================================

interface TreeStatsProps {
  tree: TreeDto;
  graph: TreeGraphData;
}

export function TreeStats({ graph }: TreeStatsProps) {
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
    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-4">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900">
        <Users className="h-3.5 w-3.5" />
        {T.tree.totalMembers.replaceAll("{n}", String(stats.total))}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900">
        {T.tree.males.replaceAll("{n}", String(stats.males))}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-700 ring-1 ring-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:ring-pink-900">
        {T.tree.females.replaceAll("{n}", String(stats.females))}
      </span>
      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        {T.tree.living.replaceAll("{n}", String(stats.living))}
      </span>
      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        {T.tree.deceasedCount.replaceAll("{n}", String(stats.deceased))}
      </span>
      <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        {T.tree.totalGenerations.replaceAll("{n}", String(stats.generations))}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-700 ring-1 ring-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:ring-pink-900">
        <HeartHandshake className="h-3.5 w-3.5" />
        {T.tree.totalMarriages.replaceAll("{n}", String(graph.marriageById.size))}
      </span>
    </div>
  );
}
