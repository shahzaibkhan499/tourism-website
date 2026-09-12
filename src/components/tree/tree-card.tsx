"use client";

import Link from "next/link";
import { GitFork, Globe, Lock, Shield, Trash2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { T } from "@/lib/i18n";
import type { TreeDto } from "@/types/tree";

const VISIBILITY_META: Record<string, { label: string; urdu: string; icon: typeof Lock }> = {
  PRIVATE: { label: "Private", urdu: "نجی", icon: Lock },
  COLLABORATORS: { label: "Collaborators", urdu: "ساتھیوں کے لیے", icon: Shield },
  CLAN_ONLY: { label: "Clan Only", urdu: "صرف کلان", icon: Shield },
  REGISTERED: { label: "Registered", urdu: "رجسٹرڈ ممبرز", icon: Globe },
  PUBLIC: { label: "Public", urdu: "عوامی", icon: Globe },
};

const ROLE_META: Record<string, { label: string; urdu: string }> = {
  OWNER: { label: "Owner", urdu: "مالک" },
  ADMIN: { label: "Admin", urdu: "منتظم" },
  EDITOR: { label: "Editor", urdu: "مدیر" },
  VIEWER: { label: "Viewer", urdu: "ناظر" },
};

interface TreeCardProps {
  tree: TreeDto;
  ownerName?: string | null;
  onDelete?: (id: string, name: string) => void;
  deleting?: boolean;
}

export function TreeCard({ tree, ownerName, onDelete, deleting }: TreeCardProps) {
  const vis = VISIBILITY_META[tree.visibility] ?? VISIBILITY_META.PRIVATE;
  const VisIcon = vis.icon;
  const role = ROLE_META[tree.role ?? "OWNER"] ?? ROLE_META.OWNER;
  const isOwner = tree.isOwner ?? tree.role === "OWNER";

  return (
    <Card className="group transition-all hover:shadow-md hover:ring-1 hover:ring-emerald-200">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/tree/${tree.id}`}
              className="line-clamp-1 text-base font-semibold text-gray-900 transition-colors hover:text-emerald-700"
            >
              {tree.name}
            </Link>
            <div className="mt-0.5 line-clamp-2 text-sm text-gray-500">
              {tree.description || "No description — کوئی تفصیل نہیں"}
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {role.label} · {role.urdu}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {T.tree.totalMembers.replaceAll("{n}", String(tree.memberCount))}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" />
            {T.tree.totalGenerations.replaceAll("{n}", String(tree.generationCount))}
          </span>
          <span className="inline-flex items-center gap-1">
            <VisIcon className="h-3.5 w-3.5" />
            {vis.label} · {vis.urdu}
          </span>
          {!isOwner && ownerName && <span className="text-gray-400">By — از: {ownerName}</span>}
        </div>

        <div className="mt-1 flex items-center gap-2 border-t pt-3">
          <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href={`/tree/${tree.id}`}>{T.tree.openTree}</Link>
          </Button>
          {isOwner && onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={deleting}
              onClick={() => onDelete(tree.id, tree.name)}
              aria-label={`${tree.name} ڈیلیٹ کریں`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
