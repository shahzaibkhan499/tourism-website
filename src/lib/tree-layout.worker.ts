import { buildTreeGraph } from "@/lib/tree-graph";
import { layoutTree } from "@/lib/tree-layout";
import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeMemberDto, TreeRelationshipDto, TreeMarriageDto } from "@/types/tree";

// ============================================================
// TREE LAYOUT WORKER — runs the layout engine off the main
// thread for large trees (1000+ members), Step 43.
// Receives raw member/relationship/marriage rows (structured-
// cloneable) and posts back the TreeLayoutResult.
// ============================================================

interface WorkerRequest {
  members: TreeMemberDto[];
  relationships: TreeRelationshipDto[];
  marriages: TreeMarriageDto[];
  rootId: string | null;
  malesFirst: boolean;
  direction: "TB" | "BT" | "LR" | "RL";
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const { members, relationships, marriages, rootId, malesFirst, direction } = event.data;
    const graph: TreeGraphData = buildTreeGraph(members, relationships, marriages);
    const layout = layoutTree(graph, { rootId, malesFirst, direction });
    (self as unknown as Worker).postMessage({ ok: true, layout });
  } catch (error) {
    (self as unknown as Worker).postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "layout worker error",
    });
  }
};

export {};
