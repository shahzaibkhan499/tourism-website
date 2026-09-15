"use client";

import { optimizeImageUrl } from "@/lib/utils";

import { useMemo, useState } from "react";
import { BookOpen, CalendarClock, HeartHandshake, Info, MessageCircle, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTreeStore } from "@/stores/tree-store";
import type { TreeGraphData } from "@/lib/tree-graph";
import { ageOf, formatDate, fullName, initials, isDeceased } from "@/lib/tree-utils";
import type { TreeMemberDto } from "@/types/tree";
import { MemberComments } from "@/components/tree/member-comments";
import { MemberTimeline } from "@/components/tree/member-timeline";
import { MemberStories } from "@/components/tree/member-stories";
import { VerifySection } from "@/components/tree/verify-section";
import { SiblingReorderDialog } from "@/components/tree/sibling-reorder-dialog";
import { QuickAddSection } from "@/components/tree/quick-add-section";
import { T } from "@/lib/i18n";

// ============================================================
// TREE SIDEBAR — right details panel: member info (parents,
// spouses, children, siblings) + tabs (info/comments/timeline/
// stories).
// ============================================================

interface TreeSidebarProps {
  treeId: string;
  graph: TreeGraphData;
  canEdit: boolean;
  onDataChanged?: () => void;
}

export function TreeSidebar({ treeId, graph, canEdit, onDataChanged }: TreeSidebarProps) {
  const open = useTreeStore((s) => s.detailPanelOpen);
  const selectedId = useTreeStore((s) => s.selectedMemberId);
  const tab = useTreeStore((s) => s.detailTab);
  const setTab = useTreeStore((s) => s.setDetailTab);
  const close = useTreeStore((s) => s.setDetailPanel);
  const setSelected = useTreeStore((s) => s.setSelectedMember);
  // Round 12 (Fix 3) — sidebar button reuses the store-driven Edit Profile
  // modal that is mounted in the tree page client.
  const setEditMemberOpen = useTreeStore((s) => s.setEditMemberOpen);

  const member = selectedId ? graph.memberById.get(selectedId) : undefined;
  const [reorderOpen, setReorderOpen] = useState(false);

  const relatives = useMemo(() => {
    if (!member) return { parents: [], spouses: [], children: [], siblings: [] };
    const parentIds = graph.parentIdsOf.get(member.id) ?? [];
    const childrenIds = graph.childrenIdsOf.get(member.id) ?? [];
    const siblings = new Set<string>();
    for (const pid of parentIds) {
      for (const c of graph.childrenIdsOf.get(pid) ?? []) {
        if (c !== member.id) siblings.add(c);
      }
    }
    return {
      parents: parentIds.map((id) => graph.memberById.get(id)).filter(Boolean),
      spouses: graph.spousesOf(member.id).map((s) => s.spouse),
      children: childrenIds.map((id) => graph.memberById.get(id)).filter(Boolean),
      siblings: Array.from(siblings).map((id) => graph.memberById.get(id)).filter(Boolean),
    };
  }, [member, graph]);

  if (!open || !member) return null;

  const age = ageOf(member);
  const deceased = isDeceased(member);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:w-[340px]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{T.tree.memberDetails}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            close(false);
            setSelected(null);
          }}
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* header */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={optimizeImageUrl(member.photo)}
              alt={`${fullName(member)} — Family Member`}
              loading="lazy"
              className={`h-14 w-14 rounded-full object-cover ring-2 ${deceased ? "ring-gray-300 grayscale" : member.gender === "MALE" ? "ring-blue-300" : "ring-pink-300"}`}
            />
          ) : (
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${
                deceased ? "bg-gray-400" : member.gender === "MALE" ? "bg-blue-500" : "bg-pink-500"
              }`}
            >
              {initials(member)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-900">{fullName(member)}</h3>
              {deceased && <span title={T.tree.deceased}>🕯️</span>}
            </div>
            <p className="text-xs text-gray-500">
              {member.dateOfBirth && `${T.tree.born} ${formatDate(member.dateOfBirth)}`}
              {member.dateOfDeath && ` · ${T.tree.died} ${formatDate(member.dateOfDeath)}`}
              {age !== null && ` · ${age} سال`}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {T.tree.generation} {member.generation}
              {member.currentCity ? ` · ${member.currentCity}` : ""}
            </p>
          </div>
        </div>
        {member.occupation && (
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">{T.profile.occupation}:</span> {member.occupation}
          </p>
        )}
        {member.education && (
          <p className="mt-0.5 text-sm text-gray-700">
            <span className="font-medium">{T.profile.education}:</span> {member.education}
          </p>
        )}
        {member.bio && <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-600">{member.bio}</p>}
        <div className="mt-2">
          <VerifySection treeId={treeId} memberId={member.id} canEdit={canEdit} />
        </div>
      </div>

      {/* Round 12 (Fix 3) — Edit Profile (above the quick-add relatives) */}
      {canEdit && (
        <div className="border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
            onClick={() => setEditMemberOpen(true)}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            <span dir="ltr">Edit Profile</span>
            <span className="text-gray-400"> — </span>
            <span dir="rtl" className="font-urdu">
              پروفائل میں ترمیم کریں
            </span>
          </Button>
        </div>
      )}

      {/* quick add relatives (GenoPro style) */}
      <QuickAddSection treeId={treeId} graph={graph} memberId={member.id} canEdit={canEdit} onAdded={onDataChanged ?? (() => {})} />

      {/* tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: "info" as const, label: T.tree.info, icon: Info },
          { id: "comments" as const, label: T.tree.comments, icon: MessageCircle },
          { id: "timeline" as const, label: T.tree.timeline, icon: CalendarClock },
          { id: "stories" as const, label: T.tree.stories, icon: BookOpen },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "info" && (
          <div className="space-y-4 p-4">
            <RelativeSection title={T.tree.parents} items={relatives.parents} empty={T.tree.noParents} />
            <RelativeSection title={T.tree.spouses} items={relatives.spouses} empty={T.tree.noSpouses} />
            <RelativeSection title={T.tree.children} items={relatives.children} empty={T.tree.noChildren} />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{T.tree.siblings}</h4>
                {canEdit && relatives.siblings.length > 0 && (
                  <button
                    type="button"
                    className="rounded border px-1.5 py-0.5 text-[10px] text-gray-500 hover:border-emerald-300 hover:text-emerald-600 dark:text-gray-400"
                    onClick={() => setReorderOpen(true)}
                  >
                    {T.tree.reorderSiblings}
                  </button>
                )}
              </div>
              <RelativeSection title="" items={relatives.siblings} empty={T.tree.noSiblings} />
            </div>
          </div>
        )}
        {tab === "comments" && <MemberComments treeId={treeId} memberId={member.id} />}
        {tab === "timeline" && <MemberTimeline treeId={treeId} memberId={member.id} />}
        {tab === "stories" && <MemberStories treeId={treeId} memberId={member.id} />}
      </div>

      <SiblingReorderDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        treeId={treeId}
        graph={graph}
        memberId={member.id}
        onSaved={() => {
          setReorderOpen(false);
          onDataChanged?.();
        }}
      />
    </aside>
  );
}

function RelativeSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: (TreeMemberDto | undefined)[];
  empty: string;
}) {
  const setSelected = useTreeStore((s) => s.setSelectedMember);
  const list = items.filter((x): x is TreeMemberDto => Boolean(x));
  return (
    <div>
      {title && <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h4>}
      {list.length === 0 ? (
        <p className="text-xs text-gray-400">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {list.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.id)}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {fullName(m)}
              <HeartHandshake className="ml-1 inline h-3 w-3 text-pink-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
