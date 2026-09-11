"use client";

import { create } from "zustand";
import type { LayoutDirection, TreeMemberDto } from "@/types/tree";

export interface TreeContextMenuState {
  x: number;
  y: number;
  memberId: string | null;
}

export interface TreeSearchMatch {
  index: number;
  total: number;
  memberId: string;
}

export interface TreeNodeDatum {
  member: TreeMemberDto;
  depth: number;
  x: number;
  y: number;
  spouseSlot: number;
}

export interface TreeStoreState {
  treeId: string | null;
  selectedMemberId: string | null;
  hoveredMemberId: string | null;
  searchQuery: string;
  searchMatches: TreeSearchMatch[];
  direction: LayoutDirection;
  zoom: number;
  panX: number;
  panY: number;
  showMinimap: boolean;
  showLegend: boolean;
  showNames: boolean;
  showPhotos: boolean;
  showDates: boolean;
  malesFirst: boolean;
  contextMenu: TreeContextMenuState;
  detailPanelOpen: boolean;
  detailTab: "info" | "comments" | "timeline" | "stories";
  addMemberOpen: boolean;
  editMemberOpen: boolean;
  addMarriageOpen: boolean;
  addRelationshipOpen: boolean;
  importOpen: boolean;
  exportOpen: boolean;
  inviteOpen: boolean;
  duplicatesOpen: boolean;
  mergeOpen: boolean;
  privacyOpen: boolean;
  collaboratorsOpen: boolean;
  calculatorOpen: boolean;
  compareOpen: boolean;
  historyOpen: boolean;
  searchOpen: boolean;
  deletingMemberId: string | null;
  pendingNodes: TreeNodeDatum[];
  filters: { generation: number | null; gender: string | null; living: boolean | null };

  setTreeId: (id: string | null) => void;
  setSelectedMember: (id: string | null) => void;
  setHoveredMember: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSearchMatches: (m: TreeSearchMatch[]) => void;
  setDirection: (d: LayoutDirection) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  toggleMinimap: () => void;
  toggleLegend: () => void;
  toggleNames: () => void;
  togglePhotos: () => void;
  toggleDates: () => void;
  toggleMalesFirst: () => void;
  openContextMenu: (x: number, y: number, memberId: string) => void;
  closeContextMenu: () => void;
  setDetailPanel: (open: boolean) => void;
  setDetailTab: (tab: "info" | "comments" | "timeline" | "stories") => void;
  setAddMemberOpen: (v: boolean) => void;
  setEditMemberOpen: (v: boolean) => void;
  setAddMarriageOpen: (v: boolean) => void;
  setAddRelationshipOpen: (v: boolean) => void;
  setImportOpen: (v: boolean) => void;
  setExportOpen: (v: boolean) => void;
  setInviteOpen: (v: boolean) => void;
  setDuplicatesOpen: (v: boolean) => void;
  setMergeOpen: (v: boolean) => void;
  setPrivacyOpen: (v: boolean) => void;
  setCollaboratorsOpen: (v: boolean) => void;
  setCalculatorOpen: (v: boolean) => void;
  setCompareOpen: (v: boolean) => void;
  setHistoryOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setDeletingMember: (id: string | null) => void;
  setPendingNodes: (nodes: TreeNodeDatum[]) => void;
  setFilters: (f: Partial<TreeStoreState["filters"]>) => void;
  reset: () => void;
}

const initialState = {
  treeId: null,
  selectedMemberId: null,
  hoveredMemberId: null,
  searchQuery: "",
  searchMatches: [],
  direction: "TB" as LayoutDirection,
  zoom: 1,
  panX: 0,
  panY: 0,
  showMinimap: true,
  showLegend: true,
  showNames: true,
  showPhotos: true,
  showDates: true,
  malesFirst: true,
  contextMenu: { x: 0, y: 0, memberId: null },
  detailPanelOpen: false,
  detailTab: "info" as "info" | "comments" | "timeline" | "stories",
  addMemberOpen: false,
  editMemberOpen: false,
  addMarriageOpen: false,
  addRelationshipOpen: false,
  importOpen: false,
  exportOpen: false,
  inviteOpen: false,
  duplicatesOpen: false,
  mergeOpen: false,
  privacyOpen: false,
  collaboratorsOpen: false,
  calculatorOpen: false,
  compareOpen: false,
  historyOpen: false,
  searchOpen: false,
  deletingMemberId: null,
  pendingNodes: [] as TreeNodeDatum[],
  filters: { generation: null, gender: null, living: null },
};

export const useTreeStore = create<TreeStoreState>((set) => ({
  ...initialState,

  setTreeId: (id) => set({ treeId: id }),
  setSelectedMember: (id) =>
    set((s) => ({
      selectedMemberId: id,
      detailPanelOpen: Boolean(id),
      contextMenu: id ? s.contextMenu : { x: 0, y: 0, memberId: null },
    })),
  setHoveredMember: (id) => set({ hoveredMemberId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchMatches: (m) => set({ searchMatches: m }),
  setDirection: (d) => set({ direction: d }),
  setZoom: (z) => set({ zoom: Math.min(3, Math.max(0.2, z)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleLegend: () => set((s) => ({ showLegend: !s.showLegend })),
  toggleNames: () => set((s) => ({ showNames: !s.showNames })),
  togglePhotos: () => set((s) => ({ showPhotos: !s.showPhotos })),
  toggleDates: () => set((s) => ({ showDates: !s.showDates })),
  toggleMalesFirst: () => set((s) => ({ malesFirst: !s.malesFirst })),
  openContextMenu: (x, y, memberId) => set({ contextMenu: { x, y, memberId } }),
  closeContextMenu: () => set({ contextMenu: { x: 0, y: 0, memberId: null } }),
  setDetailPanel: (open) => set({ detailPanelOpen: open }),
  setDetailTab: (tab) => set({ detailTab: tab }),
  setAddMemberOpen: (v) => set({ addMemberOpen: v }),
  setEditMemberOpen: (v) => set({ editMemberOpen: v }),
  setAddMarriageOpen: (v) => set({ addMarriageOpen: v }),
  setAddRelationshipOpen: (v) => set({ addRelationshipOpen: v }),
  setImportOpen: (v) => set({ importOpen: v }),
  setExportOpen: (v) => set({ exportOpen: v }),
  setInviteOpen: (v) => set({ inviteOpen: v }),
  setDuplicatesOpen: (v) => set({ duplicatesOpen: v }),
  setMergeOpen: (v) => set({ mergeOpen: v }),
  setPrivacyOpen: (v) => set({ privacyOpen: v }),
  setCollaboratorsOpen: (v) => set({ collaboratorsOpen: v }),
  setCalculatorOpen: (v) => set({ calculatorOpen: v }),
  setCompareOpen: (v) => set({ compareOpen: v }),
  setHistoryOpen: (v) => set({ historyOpen: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setDeletingMember: (id) => set({ deletingMemberId: id }),
  setPendingNodes: (nodes) => set({ pendingNodes: nodes }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  reset: () => set({ ...initialState }),
}));
