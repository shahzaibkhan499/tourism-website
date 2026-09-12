"use client";

import { useState } from "react";
import { useTreeStore } from "@/stores/tree-store";
import { T } from "@/lib/i18n";
import { fullName } from "@/lib/tree-utils";
import type { TreeGraphData } from "@/lib/tree-graph";
import { QuickAddButton } from "@/components/tree/quick-add-button";
import { QuickAddModal, type QuickAddType } from "@/components/tree/quick-add-modal";

// ============================================================
// QUICK ADD SECTION — 8 GenoPro-style relationship buttons
// shown in the sidebar when a member is selected.
// 2-column grid on mobile, 4-column on desktop.
// ============================================================

interface QuickAddSectionProps {
  treeId: string;
  graph: TreeGraphData;
  memberId: string;
  canEdit: boolean;
  onAdded: () => void;
}

export function QuickAddSection({ treeId, graph, memberId, canEdit, onAdded }: QuickAddSectionProps) {
  const [quickAddType, setQuickAddType] = useState<QuickAddType | null>(null);
  const member = graph.memberById.get(memberId);
  if (!member || !canEdit) return null;

  const isMale = member.gender === "MALE";

  const open = (t: QuickAddType) => setQuickAddType(t);

  return (
    <div className="border-b px-4 py-3">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {T.tree.selectedMember.replaceAll("{name}", fullName(member))}
      </h4>
      <h5 className="mb-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{T.tree.addRelative}</h5>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <QuickAddButton emoji="👨" label="Father" labelUrdu="والد" variant="male" onClick={() => open("FATHER")} />
        <QuickAddButton emoji="👩" label="Mother" labelUrdu="والدہ" variant="female" onClick={() => open("MOTHER")} />
        <QuickAddButton emoji="👨" label="Brother" labelUrdu="بھائی" variant="male" onClick={() => open("BROTHER")} />
        <QuickAddButton emoji="👩" label="Sister" labelUrdu="بہن" variant="female" onClick={() => open("SISTER")} />
        <QuickAddButton
          emoji="💍"
          label="Husband"
          labelUrdu="شوہر"
          variant="spouse"
          disabled={isMale}
          disabledTooltip={T.tree.husbandDisabledTooltip}
          onClick={() => open("HUSBAND")}
        />
        <QuickAddButton
          emoji="💍"
          label="Wife"
          labelUrdu="بیوی"
          variant="spouse"
          disabled={!isMale}
          disabledTooltip={T.tree.wifeDisabledTooltip}
          onClick={() => open("WIFE")}
        />
        <QuickAddButton emoji="👦" label="Son" labelUrdu="بیٹا" variant="male" onClick={() => open("SON")} />
        <QuickAddButton emoji="👧" label="Daughter" labelUrdu="بیٹی" variant="female" onClick={() => open("DAUGHTER")} />
      </div>

      {quickAddType && (
        <QuickAddModal
          open
          onOpenChange={(v) => !v && setQuickAddType(null)}
          treeId={treeId}
          graph={graph}
          memberId={memberId}
          relationType={quickAddType}
          onAdded={() => {
            onAdded();
            const selected = useTreeStore.getState().selectedMemberId;
            if (selected) useTreeStore.getState().setSelectedMember(selected);
          }}
        />
      )}
    </div>
  );
}
