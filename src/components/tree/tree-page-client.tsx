"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calculator,
  Copy,
  Download,
  GitMerge,
  HeartHandshake,
  History,
  Link2,
  Search,
  Send,
  Settings,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTreeStore } from "@/stores/tree-store";
import { buildTreeGraph } from "@/lib/tree-graph";
import { layoutTree } from "@/lib/tree-layout";
import type { TreeGraphDto } from "@/types/tree";
import { TreeViewer } from "@/components/tree/tree-viewer";
import type { TreeViewerApi } from "@/components/tree/tree-viewer";
import { TreeControls } from "@/components/tree/tree-controls";
import { TreeSearch } from "@/components/tree/tree-search";
import { TreeLegend } from "@/components/tree/tree-legend";
import { TreeMinimap } from "@/components/tree/tree-minimap";
import { TreeSidebar } from "@/components/tree/tree-sidebar";
import { TreeStats } from "@/components/tree/tree-stats";
import { TreeContextMenu } from "@/components/tree/context-menu";
import { AddMemberModal } from "@/components/tree/add-member-modal";
import { EditMemberModal } from "@/components/tree/edit-member-modal";
import { AddMarriageModal } from "@/components/tree/add-marriage-modal";
import { AddRelationshipModal } from "@/components/tree/add-relationship-modal";
import { DeleteMemberDialog } from "@/components/tree/delete-member-dialog";
import { RelationshipCalculator } from "@/components/tree/relationship-calculator";
import { MemberComparison } from "@/components/tree/member-comparison";
import { DuplicateManager } from "@/components/tree/duplicate-manager";
import { MergePreview } from "@/components/tree/merge-preview";
import { InviteModal } from "@/components/tree/invite-modal";
import { ImportModal } from "@/components/tree/import-modal";
import { ExportModal } from "@/components/tree/export-modal";
import { TreeStatsPanel } from "@/components/tree/tree-stats-panel";
import { CanvasTreeViewer } from "@/components/tree/canvas-tree-viewer";
import type { CanvasViewerApi } from "@/components/tree/canvas-tree-viewer";
import { MarriageManager } from "@/components/tree/marriage-manager";
import { RelationshipManager } from "@/components/tree/relationship-manager";

// ============================================================
// TREE PAGE CLIENT — loads graph, wires viewer + sidebar +
// toolbar + all modals + context menu + search + minimap.
// ============================================================

interface TreePageClientProps {
  treeId: string;
}

export function TreePageClient({ treeId }: TreePageClientProps) {
  const [data, setData] = useState<TreeGraphDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<{ x: number; y: number; k: number; width: number; height: number } | null>(null);
  const viewerRef = useRef<TreeViewerApi | null>(null);

  const setTreeId = useTreeStore((s) => s.setTreeId);
  const contextMenu = useTreeStore((s) => s.contextMenu);
  const setAddMemberOpen = useTreeStore((s) => s.setAddMemberOpen);
  const setEditMemberOpen = useTreeStore((s) => s.setEditMemberOpen);
  const setAddMarriageOpen = useTreeStore((s) => s.setAddMarriageOpen);
  const setAddRelationshipOpen = useTreeStore((s) => s.setAddRelationshipOpen);
  const setDeletingMember = useTreeStore((s) => s.setDeletingMember);
  const setSearchOpen = useTreeStore((s) => s.setSearchOpen);
  const searchOpen = useTreeStore((s) => s.searchOpen);
  const addMemberOpen = useTreeStore((s) => s.addMemberOpen);
  const editMemberOpen = useTreeStore((s) => s.editMemberOpen);
  const addMarriageOpen = useTreeStore((s) => s.addMarriageOpen);
  const addRelationshipOpen = useTreeStore((s) => s.addRelationshipOpen);
  const deletingMemberId = useTreeStore((s) => s.deletingMemberId);
  const selectedMemberId = useTreeStore((s) => s.selectedMemberId);

  const direction = useTreeStore((s) => s.direction);
  const malesFirst = useTreeStore((s) => s.malesFirst);
  const maxGeneration = useTreeStore((s) => s.filters.maxGeneration);
  const setFilters = useTreeStore((s) => s.setFilters);
  const detailPanelOpen = useTreeStore((s) => s.detailPanelOpen);
  const setDetailPanel = useTreeStore((s) => s.setDetailPanel);

  const setCalculatorOpen = useTreeStore((s) => s.setCalculatorOpen);
  const setCompareOpen = useTreeStore((s) => s.setCompareOpen);
  const setDuplicatesOpen = useTreeStore((s) => s.setDuplicatesOpen);
  const setMergeOpen = useTreeStore((s) => s.setMergeOpen);
  const setInviteOpen = useTreeStore((s) => s.setInviteOpen);
  const setImportOpen = useTreeStore((s) => s.setImportOpen);
  const setExportOpen = useTreeStore((s) => s.setExportOpen);
  const calculatorOpen = useTreeStore((s) => s.calculatorOpen);
  const compareOpen = useTreeStore((s) => s.compareOpen);
  const duplicatesOpen = useTreeStore((s) => s.duplicatesOpen);
  const mergeOpen = useTreeStore((s) => s.mergeOpen);
  const inviteOpen = useTreeStore((s) => s.inviteOpen);
  const importOpen = useTreeStore((s) => s.importOpen);
  const exportOpen = useTreeStore((s) => s.exportOpen);
  const [statsOpen, setStatsOpen] = useState(false);
  const [marriagesOpen, setMarriagesOpen] = useState(false);
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [addMemberPresets, setAddMemberPresets] = useState<{ parentIds?: string[]; spouseId?: string; gender?: "MALE" | "FEMALE" }>({});
  const [marriagePreset, setMarriagePreset] = useState<string | undefined>(undefined);
  const [relationshipPreset, setRelationshipPreset] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "شجرہ لوڈ نہیں ہو سکا");
      setData(j);
      setTreeId(treeId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [treeId, setTreeId]);

  useEffect(() => {
    load();
  }, [load]);

  // keyboard: Ctrl+F opens search; S toggles details panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey && selectedMemberId) {
        e.preventDefault();
        setDetailPanel(!useTreeStore.getState().detailPanelOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen, setDetailPanel, selectedMemberId]);

  // mobile detection (bottom sheet mode, Step 41)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const fullGraph = useMemo(() => {
    if (!data) return null;
    return buildTreeGraph(data.members, data.relationships, data.marriages);
  }, [data]);

  const maxGen = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.members.map((m) => m.generation), 1);
  }, [data]);

  const defaultDepth = data && data.members.length > 200 ? 4 : null;
  const activeDepth = maxGeneration ?? defaultDepth;

  const graph = useMemo(() => {
    if (!fullGraph) return null;
    if (activeDepth === null) return fullGraph;
    const visible = fullGraph.members.filter((m) => m.generation <= activeDepth);
    const visibleIds = new Set(visible.map((m) => m.id));
    const rels = data!.relationships.filter(
      (r) => visibleIds.has(r.parentId) && visibleIds.has(r.childId)
    );
    const marrs = data!.marriages.filter(
      (m) => visibleIds.has(m.spouse1Id) && visibleIds.has(m.spouse2Id)
    );
    return buildTreeGraph(visible, rels, marrs);
  }, [fullGraph, activeDepth, data]);

  const hiddenGenerationCount = useMemo(() => {
    if (!fullGraph || activeDepth === null) return 0;
    return fullGraph.members.filter((m) => m.generation > activeDepth).length;
  }, [fullGraph, activeDepth]);

  const layout = useMemo(() => {
    if (!graph) return null;
    return layoutTree(graph, {
      rootId: data?.rootMemberId ?? null,
      malesFirst,
      direction,
    });
  }, [graph, data?.rootMemberId, malesFirst, direction]);

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-4 h-10 w-72" />
        <Skeleton className="mb-2 h-8 w-full max-w-md" />
        <Skeleton className="h-[72vh] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data || !fullGraph || !graph || !layout) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center">
        <p className="text-base font-medium text-red-700">{error || "شجرہ لوڈ نہیں ہو سکا"}</p>
        <Button variant="outline" className="mt-3" onClick={load}>
          دوبارہ کوشش کریں
        </Button>
        <Button variant="ghost" className="mt-3 ml-2" asChild>
          <Link href="/tree">واپس — تمام شجرے</Link>
        </Button>
      </div>
    );
  }

  const tree = data.tree;
  const canEdit = data.canEdit;
  const selectedMember = selectedMemberId ? graph.memberById.get(selectedMemberId) : undefined;

  const openAddMember = (presets: { parentIds?: string[]; spouseId?: string; gender?: "MALE" | "FEMALE" }) => {
    setAddMemberPresets(presets);
    setAddMemberOpen(true);
  };

  const toolbarBtn = "h-8 text-xs";

  return (
    <div>
      <PageHeader
        title={tree.name}
        titleUrdu="شجرہ نسب"
        description={tree.description ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-1.5 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1">
            {canEdit && (
              <>
                <Button size="sm" className={toolbarBtn + " bg-emerald-600 hover:bg-emerald-700"} onClick={() => openAddMember({})}>
                  <UserPlus className="mr-1 h-3.5 w-3.5" />
                  ممبر شامل کریں
                </Button>
                <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setAddMarriageOpen(true)}>
                  <HeartHandshake className="mr-1 h-3.5 w-3.5" />
                  شادی
                </Button>
                <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setAddRelationshipOpen(true)}>
                  <GitMerge className="mr-1 h-3.5 w-3.5" />
                  رشتہ
                </Button>
                <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setMarriagesOpen(true)}>
                  <HeartHandshake className="mr-1 h-3.5 w-3.5" />
                  شادیاں
                </Button>
                <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setRelationshipsOpen(true)}>
                  <Link2 className="mr-1 h-3.5 w-3.5" />
                  رشتے
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setCalculatorOpen(true)}>
              <Calculator className="mr-1 h-3.5 w-3.5" />
              رشتہ نکالیں
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setCompareOpen(true)}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              موازنہ
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setDuplicatesOpen(true)}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              ڈپلیکیٹس
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setMergeOpen(true)}>
              <GitMerge className="mr-1 h-3.5 w-3.5" />
              انضمام
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setInviteOpen(true)}>
              <Send className="mr-1 h-3.5 w-3.5" />
              دعوت
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setImportOpen(true)}>
              <Upload className="mr-1 h-3.5 w-3.5" />
              امپورٹ
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setExportOpen(true)}>
              <Download className="mr-1 h-3.5 w-3.5" />
              ایکسپورٹ
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setStatsOpen(true)}>
              <BarChart3 className="mr-1 h-3.5 w-3.5" />
              اعداد و شمار
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} onClick={() => setSearchOpen(true)}>
              <Search className="mr-1 h-3.5 w-3.5" />
              تلاش
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} asChild>
              <Link href={`/tree/${tree.id}/settings`}>
                <Settings className="mr-1 h-3.5 w-3.5" />
                ترتیبات
              </Link>
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} asChild>
              <Link href={`/tree/${tree.id}/collaborate`}>
                <Users className="mr-1 h-3.5 w-3.5" />
                ساتھی
              </Link>
            </Button>
            <Button size="sm" variant="outline" className={toolbarBtn} asChild>
              <Link href={`/tree/${tree.id}/history`}>
                <History className="mr-1 h-3.5 w-3.5" />
                تاریخچہ
              </Link>
            </Button>
            <Button size="sm" variant="ghost" className={toolbarBtn} asChild>
              <Link href="/tree">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                واپس
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-3">
        <TreeStats tree={tree} graph={graph} />
      </div>

      <div className="mb-3">
        <TreeControls viewerApi={viewerRef} maxGen={maxGen} />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <TreeSearch graph={graph} open={searchOpen} onClose={() => setSearchOpen(false)} viewerApi={viewerRef} />
          {graph.members.length > 1000 ? (
            <CanvasTreeViewer
              ref={viewerRef as React.RefObject<CanvasViewerApi>}
              members={graph.members}
              relationships={data.relationships}
              marriages={data.marriages}
              rootId={data.rootMemberId}
              onContextMenu={(e, memberId) => {
                useTreeStore.getState().openContextMenu(e.clientX, e.clientY, memberId);
              }}
            />
          ) : (
            <TreeViewer
              ref={viewerRef}
              graph={graph}
              onContextMenu={(e, memberId) => {
                useTreeStore.getState().openContextMenu(e.clientX, e.clientY, memberId);
              }}
              onViewportChange={setViewport}
            />
          )}
          <TreeMinimap layout={layout} graph={graph} viewport={viewport} viewerApi={viewerRef} />
          <TreeLegend />
          {hiddenGenerationCount > 0 && (
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
              <Button
                size="sm"
                className="h-8 bg-emerald-600 shadow-lg hover:bg-emerald-700"
                onClick={() => setFilters({ maxGeneration: null })}
              >
                {hiddenGenerationCount} مزید ممبرز دکھائیں (نسلیں: {activeDepth})
              </Button>
            </div>
          )}
        </div>
        {isMobile ? (
          detailPanelOpen && (
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDetailPanel(false)}>
              <div className="absolute inset-x-0 bottom-0 max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
                <TreeSidebar treeId={tree.id} graph={graph} canEdit={canEdit} onDataChanged={load} />
              </div>
            </div>
          )
        ) : (
          <TreeSidebar treeId={tree.id} graph={graph} canEdit={canEdit} onDataChanged={load} />
        )}
      </div>

      <TreeContextMenu
        canEdit={canEdit}
        onEdit={(id) => {
          useTreeStore.getState().setSelectedMember(id);
          setEditMemberOpen(true);
        }}
        onAddChild={(id) => openAddMember({ parentIds: [id] })}
        onAddSpouse={(id) => {
          const m = graph.memberById.get(id);
          openAddMember({ spouseId: id, gender: m?.gender === "MALE" ? "FEMALE" : "MALE" });
        }}
        onAddParent={(id) => {
          setRelationshipPreset(id);
          setAddRelationshipOpen(true);
        }}
        onDelete={(id) => setDeletingMember(id)}
      />

      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        treeId={tree.id}
        graph={graph}
        presetParentIds={addMemberPresets.parentIds}
        presetSpouseId={addMemberPresets.spouseId}
        presetGender={addMemberPresets.gender}
        onAdded={load}
      />

      <EditMemberModal
        open={editMemberOpen}
        onOpenChange={setEditMemberOpen}
        treeId={tree.id}
        member={selectedMember ?? null}
        onSaved={load}
      />

      <AddMarriageModal
        open={addMarriageOpen}
        onOpenChange={setAddMarriageOpen}
        treeId={tree.id}
        graph={graph}
        presetSpouseId={marriagePreset}
        onSaved={load}
      />

      <AddRelationshipModal
        open={addRelationshipOpen}
        onOpenChange={setAddRelationshipOpen}
        treeId={tree.id}
        graph={graph}
        presetChildId={relationshipPreset}
        onSaved={load}
      />

      <DeleteMemberDialog
        open={Boolean(deletingMemberId)}
        onOpenChange={(v) => !v && setDeletingMember(null)}
        treeId={tree.id}
        memberId={deletingMemberId}
        graph={graph}
        onDeleted={load}
      />

      <RelationshipCalculator open={calculatorOpen} onOpenChange={setCalculatorOpen} treeId={tree.id} graph={graph} />

      <MemberComparison open={compareOpen} onOpenChange={setCompareOpen} treeId={tree.id} graph={graph} />

      <DuplicateManager open={duplicatesOpen} onOpenChange={setDuplicatesOpen} treeId={tree.id} onResolved={load} />

      <MergePreview open={mergeOpen} onOpenChange={setMergeOpen} sourceTreeId={tree.id} onMerged={load} />

      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} treeId={tree.id} />

      <ImportModal open={importOpen} onOpenChange={setImportOpen} treeId={tree.id} onImported={load} />

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} treeId={tree.id} />

      <TreeStatsPanel open={statsOpen} onOpenChange={setStatsOpen} treeId={tree.id} />

      <MarriageManager open={marriagesOpen} onOpenChange={setMarriagesOpen} treeId={tree.id} graph={graph} onSaved={load} />

      <RelationshipManager
        open={relationshipsOpen}
        onOpenChange={setRelationshipsOpen}
        treeId={tree.id}
        graph={graph}
        relationships={data.relationships}
        onSaved={load}
      />
    </div>
  );
}
