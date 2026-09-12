import type {
  LayoutDirection,
  MarriageStatus,
  MarriageType,
  RelationshipType,
} from "@/types/tree";
import type { TreeGraphData, TreeFamily } from "@/lib/tree-graph";
import { NODE_H, NODE_W, ROOT_GAP, SLOT, LEVEL, familyKey, sortMarriages, sortSiblings } from "@/lib/tree-utils";

// ============================================================
// FAMILY TREE — layout engine
// Recursive tidy layout (Buchheim-style one-pass slot assignment):
//  - each person is an anchor for their marriages
//  - each marriage gets its OWN column: spouse above, children below
//    the marriage link (GenoPro style, "children under correct mother")
//  - sibling ordering per spec (sortOrder → DOB → gender → type → name)
//  - multiple marriages → husband centered between spouse columns,
//    marriage lines get small vertical offsets so they never overlap
// Output: final-space node centers + marriage lines + child-bus paths.
// ============================================================

export interface PlacedNode {
  id: string;
  cx: number;
  cy: number;
  depth: number;
}

export interface PlacedMarriageLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  status: MarriageStatus;
  type: MarriageType;
}

export interface PlacedBus {
  familyKey: string;
  points: { x: number; y: number }[];
  type: RelationshipType;
}

export interface TreeLayoutResult {
  nodes: Map<string, PlacedNode>;
  marriages: PlacedMarriageLine[];
  buses: PlacedBus[];
  bounds: { width: number; height: number; minX: number; minY: number };
  rootIds: string[];
}

interface TbPos {
  x: number; // slot-space center (1 slot = SLOT px)
  y: number; // level-space (1 level = LEVEL px)
  depth: number;
}

interface UnitResult {
  width: number; // subtree width in slots
  anchorX: number; // anchor slot-space x
  anchorY: number; // anchor level-space y
}

interface BusRecord {
  family: TreeFamily;
  type: RelationshipType;
}

export function layoutTree(
  graph: TreeGraphData,
  opts: { rootId?: string | null; malesFirst: boolean; direction: LayoutDirection }
): TreeLayoutResult {
  const { rootId, malesFirst, direction } = opts;
  const placed = new Map<string, TbPos>();
  const visited = new Set<string>();
  const buses: BusRecord[] = [];
  const marriageLines: { id: string; s1: string; s2: string; status: MarriageStatus; type: MarriageType; offset: number }[] = [];

  const childrenOf = (memberId: string) => graph.childrenIdsOf.get(memberId) ?? [];
  const familyChildren = (parentIds: string[]) =>
    graph.familyByKey.get(familyKey(parentIds))?.childIds ?? [];

  // Reverse index: member -> 2-parent families it belongs to.
  // A couple that shares children must be laid out as one unit even when
  // they have no marriage record (e.g. Father/Mother quick-added).
  const familiesOf = new Map<string, TreeFamily[]>();
  for (const fam of graph.families) {
    if (fam.parentIds.length !== 2) continue;
    for (const pid of fam.parentIds) {
      const arr = familiesOf.get(pid) ?? [];
      arr.push(fam);
      familiesOf.set(pid, arr);
    }
  }

  const sortFor = (parentId: string, ids: string[]) =>
    sortSiblings(ids, graph.memberById, graph.relTypeOf, parentId, malesFirst);

  function placeUnit(memberId: string, depth: number, cursor: number): UnitResult {
    if (visited.has(memberId)) {
      const p = placed.get(memberId);
      return { width: 0, anchorX: p?.x ?? cursor, anchorY: p?.y ?? depth };
    }
    visited.add(memberId);

    const marriages = sortMarriages(graph.marriagesOf.get(memberId) ?? []);
    const directChildren = sortFor(memberId, childrenOf(memberId)).filter(
      (c) => (graph.parentIdsOf.get(c) ?? []).length === 1
    );

    const familyUnits = familiesOf.get(memberId) ?? [];
    if (marriages.length === 0 && familyUnits.length === 0) {
      // Single person unit: either a lone node or node above its direct children
      let width = 1;
      let anchorX = cursor + 0.5;
      if (directChildren.length > 0) {
        let childCursor = cursor;
        const childXs: number[] = [];
        for (const c of directChildren) {
          const u = placeUnit(c, depth + 1, childCursor);
          if (u.width > 0) {
            childXs.push(u.anchorX);
            childCursor += u.width;
          }
        }
        width = Math.max(childCursor - cursor, 1);
        if (childXs.length > 0) {
          anchorX = (Math.min(...childXs) + Math.max(...childXs)) / 2;
        }
        buses.push({
          family: graph.familyByKey.get(familyKey([memberId])) ?? {
            key: familyKey([memberId]),
            parentIds: [memberId],
            childIds: directChildren,
            marriage: null,
          },
          type: "BIOLOGICAL",
        });
      }
      placed.set(memberId, { x: anchorX, y: depth, depth });
      return { width, anchorX, anchorY: depth };
    }

    // Couple units: one column per marriage OR per marriage-less family
    // (parents who share children but have no marriage record — e.g. added
    // via Father/Mother quick-add). Spec visual: Wife1 COLUMN | ANCHOR |
    // Wife2 COLUMN ...; the anchor gets its own 1-slot column: before the
    // only spouse (n==1) or right after the first spouse column (n>1).
    type CoupleUnit = { otherId: string; childrenIds: string[]; marriage: (typeof marriages)[number] | null };
    const units: CoupleUnit[] = [];
    for (const m of marriages) {
      const otherId = m.spouse1Id === memberId ? m.spouse2Id : m.spouse1Id;
      units.push({ otherId, childrenIds: familyChildren([memberId, otherId]), marriage: m });
    }
    for (const fam of familyUnits) {
      const otherId = fam.parentIds.find((x) => x !== memberId);
      if (!otherId) continue;
      if (visited.has(otherId)) continue; // other parent already laid out this family
      if (units.some((u) => u.otherId === otherId)) continue; // already a marriage with this co-parent
      units.push({ otherId, childrenIds: fam.childIds, marriage: null });
    }

    const single = units.length === 1;
    const spouseColumns: { spouseId: string; spouseX: number; childrenIds: string[]; marriage: (typeof marriages)[number] | null }[] = [];
    let colCursor = cursor + (single ? 1 : 0);
    let firstColWidth = 1;

    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const spouseId = u.otherId;
      const pairChildren = sortFor(spouseId, u.childrenIds);
      if (i === 1 && !single) colCursor += 1; // reserve the anchor's own slot

      let childCursor = colCursor;
      const childXs: number[] = [];
      for (const c of pairChildren) {
        if (visited.has(c)) continue;
        const u = placeUnit(c, depth + 1, childCursor);
        if (u.width > 0) {
          childXs.push(u.anchorX);
          childCursor += u.width;
        }
      }
      const childrenWidth = Math.max(childCursor - colCursor, 0);

      // Spouse's OTHER marriages get extra columns on the spouse's side
      const otherMarriages = (graph.marriagesOf.get(spouseId) ?? []).filter((x) => !u.marriage || x.id !== u.marriage.id);
      let extraWidth = 0;
      for (const om of otherMarriages) {
        const otherSpouseId = om.spouse1Id === spouseId ? om.spouse2Id : om.spouse1Id;
        const otherChildren = sortFor(otherSpouseId, familyChildren([spouseId, otherSpouseId]));
        if (visited.has(otherSpouseId)) continue;
        visited.add(otherSpouseId);
        placed.set(otherSpouseId, { x: childCursor + 0.5, y: depth, depth });
        let ocCursor = childCursor + 1;
        const ocXs: number[] = [];
        for (const c of otherChildren) {
          if (visited.has(c)) continue;
          const u = placeUnit(c, depth + 1, ocCursor);
          if (u.width > 0) {
            ocXs.push(u.anchorX);
            ocCursor += u.width;
          }
        }
        const ocWidth = Math.max(ocCursor - childCursor, 1);
        if (ocXs.length > 0) {
          const newX = (Math.min(...ocXs) + Math.max(...ocXs)) / 2;
          placed.set(otherSpouseId, { x: newX, y: depth, depth });
        }
        buses.push({
          family: graph.familyByKey.get(familyKey([spouseId, otherSpouseId])) ?? {
            key: familyKey([spouseId, otherSpouseId]),
            parentIds: [spouseId, otherSpouseId],
            childIds: otherChildren,
            marriage: null,
          },
          type: "BIOLOGICAL",
        });
        extraWidth += ocWidth;
        childCursor = ocCursor;
      }

      // Spouse node sits centered above its children row
      const colWidth = Math.max(childrenWidth + extraWidth, 1);
      let spouseX: number;
      if (childXs.length > 0) {
        spouseX = (Math.min(...childXs) + Math.max(...childXs)) / 2;
      } else if (extraWidth > 0) {
        spouseX = colCursor - colWidth / 2;
      } else {
        spouseX = colCursor + 0.5;
      }
      if (!visited.has(spouseId)) {
        visited.add(spouseId);
        placed.set(spouseId, { x: spouseX, y: depth, depth });
      }
      // Recursively lay out spouse's own direct children (single-parent rows)
      for (const c of sortFor(spouseId, childrenOf(spouseId)).filter(
        (cc) => (graph.parentIdsOf.get(cc) ?? []).length === 1
      )) {
        if (visited.has(c)) continue;
        const u = placeUnit(c, depth + 1, childCursor);
        childCursor += u.width;
        if (u.width > 0) {
          buses.push({
            family: graph.familyByKey.get(familyKey([spouseId])) ?? {
              key: familyKey([spouseId]),
              parentIds: [spouseId],
              childIds: [c],
              marriage: null,
            },
            type: "BIOLOGICAL",
          });
        }
      }

      spouseColumns.push({ spouseId, spouseX, childrenIds: pairChildren, marriage: u.marriage });
      if (i === 0) firstColWidth = Math.max(colCursor - cursor, 1);
      const family = graph.familyByKey.get(familyKey([memberId, spouseId]));
      if (family && pairChildren.length > 0) {
        buses.push({ family, type: "BIOLOGICAL" });
      }
      colCursor = Math.max(colCursor + colWidth, childCursor);
    }

    const totalWidth = Math.max(colCursor - cursor, 1);
    const anchorX = single ? cursor + 0.5 : cursor + firstColWidth + 0.5;

    placed.set(memberId, { x: anchorX, y: depth, depth });

    // Marriage / family join lines (with vertical offsets to avoid overlaps).
    // Marriage-less couples get a synthetic join line so the family is still
    // visually connected (GenoPro always joins co-parents).
    spouseColumns.forEach((col, idx) => {
      const offset = (idx - (spouseColumns.length - 1) / 2) * 16;
      if (col.marriage) {
        marriageLines.push({
          id: col.marriage.id,
          s1: memberId,
          s2: col.spouseId,
          status: col.marriage.status,
          type: col.marriage.type,
          offset,
        });
      } else {
        marriageLines.push({
          id: `syn:${memberId}:${col.spouseId}`,
          s1: memberId,
          s2: col.spouseId,
          status: "MARRIED",
          type: "NIKKAH",
          offset,
        });
      }
    });

    return { width: totalWidth, anchorX, anchorY: depth };
  }

  // Lay out roots left to right. A member who has parents must NEVER be
  // forced as a layout root — the tree must start from the top ancestors,
  // otherwise the member is drawn on the same row as their own parents and
  // the family bus fractures. rootId only orders TRUE roots.
  let roots = [...graph.roots];
  if (rootId) {
    const rootHasParents = (graph.parentIdsOf.get(rootId) ?? []).length > 0;
    if (!rootHasParents) {
      roots = [rootId, ...roots.filter((r) => r !== rootId)];
    }
  }
  roots = roots.filter((r, i) => roots.indexOf(r) === i);
  if (roots.length === 0 && graph.members.length > 0) {
    roots = [graph.members[0].id];
  }

  let cursor = 0;
  for (const r of roots) {
    if (visited.has(r)) continue;
    const u = placeUnit(r, 0, cursor);
    cursor += Math.max(u.width, 1);
    if (u.width > 0) cursor += ROOT_GAP / SLOT;
  }

  // Any unvisited members (shouldn't happen, but never lose data)
  for (const m of graph.members) {
    if (!visited.has(m.id)) {
      const u = placeUnit(m.id, 0, cursor);
      cursor += Math.max(u.width, 1) + ROOT_GAP / SLOT;
    }
  }

  // Build final node map in slot space
  const tbNodes = new Map<string, PlacedNode>();
  for (const [id, p] of Array.from(placed.entries())) {
    tbNodes.set(id, { id, cx: p.x * SLOT, cy: p.y * LEVEL, depth: p.depth });
  }

  // Marriage lines in px (TB space)
  const tbMarriages: PlacedMarriageLine[] = [];
  for (const ml of marriageLines) {
    const p1 = placed.get(ml.s1);
    const p2 = placed.get(ml.s2);
    if (!p1 || !p2) continue;
    const y = p1.y * LEVEL + ml.offset;
    const xA = p1.x * SLOT;
    const xB = p2.x * SLOT;
    tbMarriages.push({
      id: ml.id,
      x1: Math.min(xA, xB) + NODE_W / 2,
      y1: y,
      x2: Math.max(xA, xB) - NODE_W / 2,
      y2: y,
      status: ml.status,
      type: ml.type,
    });
  }

  // Child buses in px (TB space): from parents' marriage region down to children row
  const tbBuses: PlacedBus[] = [];
  for (const b of buses) {
    const { family } = b;
    const parents = family.parentIds.map((id) => placed.get(id)).filter((p): p is TbPos => Boolean(p));
    const children = family.childIds
      .map((id) => placed.get(id))
      .filter((p): p is TbPos => Boolean(p));
    if (parents.length === 0 || children.length === 0) continue;

    const parentYs = parents.map((p) => p.y);
    const parentBottomY = Math.max(...parentYs) * LEVEL + NODE_H / 2; // parents' bottom edge
    const childTopY = Math.min(...children.map((c) => c.y * LEVEL)) - NODE_H / 2; // children's top edge
    const coupleRowY = Math.max(...parentYs) * LEVEL; // marriage row = parents' vertical center
    const isCouple = family.parentIds.length > 1;
    // single parent: drop starts at the parent's BOTTOM edge (never over the card)
    // couple: drop starts at the marriage line (between the two spouse cards)
    const startTop = isCouple ? coupleRowY : parentBottomY;
    const startX =
      family.parentIds.length === 1
        ? parents[0].x * SLOT
        : (parents[0].x * SLOT + parents[parents.length - 1].x * SLOT) / 2;

    const minChildX = Math.min(...children.map((c) => c.x * SLOT));
    const maxChildX = Math.max(...children.map((c) => c.x * SLOT));
    const midY = (parentBottomY + childTopY) / 2;
    const minX = Math.min(startX, minChildX);
    const maxX = Math.max(startX, maxChildX);

    // Clean polyline: vertical drop → horizontal sibling run → per-child drops.
    // Each child drop RETRACES back up to midY so the path never draws diagonals.
    const points = [
      { x: startX, y: startTop },
      { x: startX, y: midY },
      { x: minX, y: midY },
      { x: maxX, y: midY },
    ];
    const sortedChildren = [...children].sort((a, b) => a.x * SLOT - b.x * SLOT);
    for (const c of sortedChildren) {
      points.push({ x: c.x * SLOT, y: midY });
      points.push({ x: c.x * SLOT, y: childTopY });
      points.push({ x: c.x * SLOT, y: midY });
    }
    tbBuses.push({
      familyKey: family.key,
      points,
      type:
        b.type === "BIOLOGICAL"
          ? graph.relTypeOf(family.childIds[0] ?? "", family.parentIds[0] ?? "") ?? "BIOLOGICAL"
          : b.type,
    });
  }

  // Bounds in TB space (node boxes)
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of Array.from(tbNodes.values())) {
    minX = Math.min(minX, n.cx - NODE_W / 2);
    maxX = Math.max(maxX, n.cx + NODE_W / 2);
    minY = Math.min(minY, n.cy - NODE_H / 2);
    maxY = Math.max(maxY, n.cy + NODE_H / 2);
  }
  for (const b of tbBuses) {
    for (const p of b.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!isFinite(minX)) {
    minX = 0;
    maxX = NODE_W;
    minY = 0;
    maxY = NODE_H;
  }
  const tbW = maxX - minX;
  const tbH = maxY - minY;

  // Direction transform
  const transform = (x: number, y: number): { x: number; y: number } => {
    switch (direction) {
      case "TB":
        return { x: x - minX, y: y - minY };
      case "BT":
        return { x: x - minX, y: tbH - (y - minY) };
      case "LR":
        return { x: y - minY, y: x - minX };
      case "RL":
        return { x: tbH - (y - minY), y: x - minX };
    }
  };

  const nodes = new Map<string, PlacedNode>();
  for (const [id, n] of Array.from(tbNodes.entries())) {
    const t = transform(n.cx, n.cy);
    nodes.set(id, { id, cx: t.x, cy: t.y, depth: n.depth });
  }

  const marriagesOut: PlacedMarriageLine[] = tbMarriages.map((m) => {
    const p1 = transform(m.x1, m.y1);
    const p2 = transform(m.x2, m.y2);
    return {
      id: m.id,
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      status: m.status,
      type: m.type,
    };
  });

  const busesOut: PlacedBus[] = tbBuses.map((b) => ({
    familyKey: b.familyKey,
    points: b.points.map((p) => transform(p.x, p.y)),
    type: b.type,
  }));

  const width = direction === "LR" || direction === "RL" ? tbH : tbW;
  const height = direction === "LR" || direction === "RL" ? tbW : tbH;

  return {
    nodes,
    marriages: marriagesOut,
    buses: busesOut,
    bounds: { width: Math.max(width, NODE_W), height: Math.max(height, NODE_H), minX: 0, minY: 0 },
    rootIds: roots,
  };
}
