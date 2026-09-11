"use client";

import { useMemo, useState } from "react";
import { BookOpen, CalendarClock, HeartHandshake, Info, MessageCircle, X } from "lucide-react";
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
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm lg:w-[340px]">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">ممبر کی تفصیلات</span>
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
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          {member.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo}
              alt={fullName(member)}
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
              {deceased && <span title="فوت شدہ">🕯️</span>}
            </div>
            <p className="text-xs text-gray-500">
              {member.dateOfBirth && `b. ${formatDate(member.dateOfBirth)}`}
              {member.dateOfDeath && ` · d. ${formatDate(member.dateOfDeath)}`}
              {age !== null && ` · ${age} سال`}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              جنریشن {member.generation}
              {member.currentCity ? ` · ${member.currentCity}` : ""}
            </p>
          </div>
        </div>
        {member.occupation && (
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">پیشہ:</span> {member.occupation}
          </p>
        )}
        {member.education && (
          <p className="mt-0.5 text-sm text-gray-700">
            <span className="font-medium">تعلیم:</span> {member.education}
          </p>
        )}
        {member.bio && <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-600">{member.bio}</p>}
        <div className="mt-2">
          <VerifySection treeId={treeId} memberId={member.id} canEdit={canEdit} />
        </div>
      </div>

      {/* tabs */}
      <div className="flex border-b">
        {[
          { id: "info" as const, label: "معلومات", icon: Info },
          { id: "comments" as const, label: "کمنٹس", icon: MessageCircle },
          { id: "timeline" as const, label: "ٹائم لائن", icon: CalendarClock },
          { id: "stories" as const, label: "کہانیاں", icon: BookOpen },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1 border-b-2 px-2 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
            <RelativeSection title="والدین — Parents" items={relatives.parents} empty="والدین درج نہیں" />
            <RelativeSection title="شریک حیات — Spouses" items={relatives.spouses} empty="شادی درج نہیں" />
            <RelativeSection title="بچے — Children" items={relatives.children} empty="بچے درج نہیں" />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">بہن بھائی — Siblings</h4>
                {canEdit && relatives.siblings.length > 0 && (
                  <button
                    type="button"
                    className="rounded border px-1.5 py-0.5 text-[10px] text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                    onClick={() => setReorderOpen(true)}
                  >
                    ترتیب بدلیں
                  </button>
                )}
              </div>
              <RelativeSection title="" items={relatives.siblings} empty="بہن بھائی درج نہیں" />
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
              className="rounded-full border bg-gray-50 px-2.5 py-1 text-xs text-gray-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
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
