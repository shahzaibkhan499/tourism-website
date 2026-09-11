import type {
  RelationshipType,
  TreeMarriageDto,
  TreeMemberDto,
  TreeRelationshipDto,
} from "@/types/tree";
import { familyKey } from "@/lib/tree-utils";

// ============================================================
// FAMILY TREE — graph builder
// Converts flat API data (members + relationships + marriages)
// into indexed structures used by the layout engine and UI.
// ============================================================

export interface TreeFamily {
  key: string;
  parentIds: string[];
  childIds: string[];
  marriage: TreeMarriageDto | null;
}

export interface SpouseRef {
  spouse: TreeMemberDto;
  marriage: TreeMarriageDto;
}

export interface TreeGraphData {
  members: TreeMemberDto[];
  memberById: Map<string, TreeMemberDto>;
  parentIdsOf: Map<string, string[]>;
  childrenIdsOf: Map<string, string[]>;
  relTypeOf: (childId: string, parentId: string) => RelationshipType;
  marriagesOf: Map<string, TreeMarriageDto[]>;
  marriageById: Map<string, TreeMarriageDto>;
  spousesOf: (memberId: string) => SpouseRef[];
  families: TreeFamily[];
  familyByKey: Map<string, TreeFamily>;
  roots: string[];
}

export function buildTreeGraph(
  members: TreeMemberDto[],
  relationships: TreeRelationshipDto[],
  marriages: TreeMarriageDto[]
): TreeGraphData {
  const memberById = new Map<string, TreeMemberDto>();
  for (const m of members) memberById.set(m.id, m);

  const parentIdsOf = new Map<string, string[]>();
  const childrenIdsOf = new Map<string, string[]>();
  const relTypeMap = new Map<string, RelationshipType>(); // key: childId|parentId

  for (const r of relationships) {
    parentIdsOf.set(r.childId, [...(parentIdsOf.get(r.childId) ?? []), r.parentId]);
    childrenIdsOf.set(r.parentId, [...(childrenIdsOf.get(r.parentId) ?? []), r.childId]);
    relTypeMap.set(`${r.childId}|${r.parentId}`, r.type);
  }

  const marriagesOf = new Map<string, TreeMarriageDto[]>();
  const marriageById = new Map<string, TreeMarriageDto>();
  for (const m of marriages) {
    marriageById.set(m.id, m);
    marriagesOf.set(m.spouse1Id, [...(marriagesOf.get(m.spouse1Id) ?? []), m]);
    marriagesOf.set(m.spouse2Id, [...(marriagesOf.get(m.spouse2Id) ?? []), m]);
  }

  const relTypeOf = (childId: string, parentId: string): RelationshipType =>
    relTypeMap.get(`${childId}|${parentId}`) ?? "BIOLOGICAL";

  const spousesOf = (memberId: string): SpouseRef[] => {
    const ms = marriagesOf.get(memberId) ?? [];
    return ms
      .map((m) => {
        const otherId = m.spouse1Id === memberId ? m.spouse2Id : m.spouse1Id;
        const spouse = memberById.get(otherId);
        return spouse ? { spouse, marriage: m } : null;
      })
      .filter((x): x is SpouseRef => x !== null);
  };

  // Families: group children by their parent set
  const familyByKey = new Map<string, TreeFamily>();
  const familyFor = (key: string, parentIds: string[]): TreeFamily => {
    let f = familyByKey.get(key);
    if (!f) {
      // find marriage between the parents (only for 2-parent families)
      let marriage: TreeMarriageDto | null = null;
      if (parentIds.length === 2) {
        const ms = marriagesOf.get(parentIds[0]) ?? [];
        marriage =
          ms.find(
            (m) =>
              (m.spouse1Id === parentIds[0] && m.spouse2Id === parentIds[1]) ||
              (m.spouse1Id === parentIds[1] && m.spouse2Id === parentIds[0])
          ) ?? null;
      }
      f = { key, parentIds, childIds: [], marriage };
      familyByKey.set(key, f);
    }
    return f;
  };

  for (const m of members) {
    const parentIds = parentIdsOf.get(m.id) ?? [];
    if (parentIds.length === 0) continue;
    const f = familyFor(familyKey(parentIds), parentIds);
    f.childIds.push(m.id);
  }

  const families = Array.from(familyByKey.values());

  const roots = members
    .filter((m) => (parentIdsOf.get(m.id) ?? []).length === 0)
    .map((m) => m.id);

  return {
    members,
    memberById,
    parentIdsOf,
    childrenIdsOf,
    relTypeOf,
    marriagesOf,
    marriageById,
    spousesOf,
    families,
    familyByKey,
    roots,
  };
}
