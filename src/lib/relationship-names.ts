import type { TreeGraphData } from "@/lib/tree-graph";
import type { TreeMemberDto } from "@/types/tree";

// ============================================================
// RELATIONSHIP NAMES — 50+ Pakistani kinship names in Urdu.
// BFS over the graph; path edges translated to relation steps.
// ============================================================

export interface RelationStep {
  memberId: string;
  name: string;
  urdu: string;
  kind: "self" | "parent" | "child" | "spouse" | "sibling";
}

export interface RelationshipPathResult {
  found: boolean;
  steps: RelationStep[];
  pathIds: string[];
  names: string[];
  directName: string | null;
  score: number; // % closeness
  sameBloodline: boolean;
}

const PARENT_TERMS = {
  male: { name: "father", urdu: "ابو / والد" },
  female: { name: "mother", urdu: "امی / والدہ" },
};

const GRAND_TERMS = {
  P: {
    male: { name: "paternal grandfather", urdu: "دادا" },
    female: { name: "paternal grandmother", urdu: "دادی" },
  },
  M: {
    male: { name: "maternal grandfather", urdu: "نانا" },
    female: { name: "maternal grandmother", urdu: "نانی" },
  },
};

const SIB_TERMS = {
  male: { elder: { name: "elder brother", urdu: "بڑا بھائی" }, younger: { name: "younger brother", urdu: "چھوٹا بھائی" }, neutral: { name: "brother", urdu: "بھائی" } },
  female: { elder: { name: "elder sister", urdu: "بڑی بہن" }, younger: { name: "younger sister", urdu: "چھوٹی بہن" }, neutral: { name: "sister", urdu: "بہن" } },
};

interface UncleAuntTerm {
  name: string;
  urdu: string;
}

interface UncleAuntSet {
  male: { elder: UncleAuntTerm; younger: UncleAuntTerm; neutral: UncleAuntTerm };
  female: { elder?: UncleAuntTerm; younger?: UncleAuntTerm; neutral: UncleAuntTerm };
}

const UNCLE_AUNT_TERMS: Record<string, UncleAuntSet> = {
  P: {
    male: {
      elder: { name: "father's elder brother (taya)", urdu: "تایا" },
      younger: { name: "father's younger brother (chacha)", urdu: "چاچا" },
      neutral: { name: "paternal uncle", urdu: "چچا / تایا" },
    },
    female: { neutral: { name: "father's sister (phuppho)", urdu: "پھوپھو" } },
  },
  M: {
    male: {
      elder: { name: "mother's elder brother (bara mamoon)", urdu: "بڑے ماموں" },
      younger: { name: "mother's younger brother (mamoon)", urdu: "ماموں / ماما" },
      neutral: { name: "mother's brother (mamoon)", urdu: "ماموں / ماما" },
    },
    female: { neutral: { name: "mother's sister (khala)", urdu: "خالہ" } },
  },
};

const IN_LAW_TERMS = {
  wife_father: { name: "father-in-law (sasur)", urdu: "سسر" },
  wife_mother: { name: "mother-in-law (saas)", urdu: "ساس" },
  daughter_husband: { name: "son-in-law (damad)", urdu: "داماد" },
  son_wife: { name: "daughter-in-law (bahu)", urdu: "بہو" },
  husband_brother: { name: "husband's brother (dewar)", urdu: "دیور" },
  husband_elder_brother: { name: "husband's elder brother (jeth)", urdu: "جیٹھ" },
  husband_sister: { name: "husband's sister (nand)", urdu: "نند" },
  wife_brother: { name: "wife's brother (sala)", urdu: "سالا" },
  wife_sister: { name: "wife's sister (sali)", urdu: "سالی" },
  sister_husband: { name: "sister's husband (behnoi)", urdu: "بہنوئی" },
  brother_wife: { name: "brother's wife (bhabhi)", urdu: "بھابھی" },
};

const COUSIN_TERMS = {
  P_M: { male: { name: "paternal uncle's son (chacha zad bhai)", urdu: "چچا زاد بھائی" }, female: { name: "paternal uncle's daughter (chacha zad behn)", urdu: "چچا زاد بہن" } },
  M_M: { male: { name: "maternal uncle's son (mama zad bhai)", urdu: "ماما زاد بھائی" }, female: { name: "maternal uncle's daughter (mama zad behn)", urdu: "ماما زاد بہن" } },
  P_F: { male: { name: "paternal aunt's son (phuppho zad bhai)", urdu: "پھوپھا زاد بھائی" }, female: { name: "paternal aunt's daughter (phuppho zad behn)", urdu: "پھوپھا زاد بہن" } },
  M_F: { male: { name: "maternal aunt's son (khala zad bhai)", urdu: "خالہ زاد بھائی" }, female: { name: "maternal aunt's daughter (khala zad behn)", urdu: "خالہ زاد بہن" } },
};

const NIECE_NEPHEW_TERMS = {
  brother_child: { male: { name: "brother's son (bhateeja)", urdu: "بھتیجا" }, female: { name: "brother's daughter (bhateeji)", urdu: "بھتیجی" } },
  sister_child: { male: { name: "sister's son (bhaanja)", urdu: "بھانجا" }, female: { name: "sister's daughter (bhaanji)", urdu: "بھانجی" } },
};

const OTHER_TERMS = {
  adopted_son: { name: "adopted son", urdu: "لے پالک بیٹا" },
  adopted_daughter: { name: "adopted daughter", urdu: "لے پالک بیٹی" },
  foster_parent: { name: "foster parent", urdu: "رضاعی والد" },
  grandchild: { male: { name: "grandson (pota/nawasa)", urdu: "پوتا / نواسا" }, female: { name: "granddaughter (poti/nawasi)", urdu: "پوتی / نواسی" } },
  half_brother: { name: "half brother", urdu: "سوتیلا بھائی" },
  half_sister: { name: "half sister", urdu: "سوتیلی بہن" },
};

function isOlder(a: TreeMemberDto, b: TreeMemberDto): boolean | null {
  if (!a.dateOfBirth || !b.dateOfBirth) return null;
  const ta = new Date(a.dateOfBirth).getTime();
  const tb = new Date(b.dateOfBirth).getTime();
  return ta < tb; // a older than b
}

export function resolveRelationship(
  from: TreeMemberDto,
  to: TreeMemberDto,
  graph: TreeGraphData
): RelationshipPathResult {
  if (from.id === to.id) {
    return {
      found: true,
      steps: [{ memberId: from.id, name: "self", urdu: "خود", kind: "self" }],
      pathIds: [from.id],
      names: ["self — خود"],
      directName: "self",
      score: 100,
      sameBloodline: true,
    };
  }

  // BFS over undirected graph (parent/child/spouse/sibling edges)
  interface QueueItem {
    id: string;
    path: { via: string; kind: "parent" | "child" | "spouse" | "sibling"; spouseOther?: string }[];
  }
  const visited = new Set<string>([from.id]);
  const queue: QueueItem[] = [{ id: from.id, path: [] }];
  let foundPath: QueueItem["path"] | null = null;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.id === to.id) {
      foundPath = cur.path;
      break;
    }
    const neighbors: { id: string; kind: "parent" | "child" | "spouse" | "sibling" }[] = [];
    for (const p of graph.parentIdsOf.get(cur.id) ?? []) neighbors.push({ id: p, kind: "parent" });
    for (const c of graph.childrenIdsOf.get(cur.id) ?? []) neighbors.push({ id: c, kind: "child" });
    for (const s of graph.spousesOf(cur.id)) neighbors.push({ id: s.spouse.id, kind: "spouse" });
    // siblings share a parent
    for (const p of graph.parentIdsOf.get(cur.id) ?? []) {
      for (const c of graph.childrenIdsOf.get(p) ?? []) {
        if (c !== cur.id) neighbors.push({ id: c, kind: "sibling" });
      }
    }

    for (const n of neighbors) {
      if (visited.has(n.id)) continue;
      visited.add(n.id);
      queue.push({ id: n.id, path: [...cur.path, { via: n.id, kind: n.kind }] });
    }
  }

  if (!foundPath) {
    return { found: false, steps: [], pathIds: [], names: [], directName: null, score: 0, sameBloodline: false };
  }

  // Build steps with Urdu names
  const steps: RelationStep[] = [];
  const pathIds = [from.id, ...foundPath.map((e) => e.via)];
  let sameBloodline = true;

  for (const e of foundPath) {
    const target = graph.memberById.get(e.via)!;
    const g = target.gender === "MALE" ? "male" : "female";
    if (e.kind === "parent") {
      steps.push({ memberId: e.via, name: PARENT_TERMS[g].name, urdu: PARENT_TERMS[g].urdu, kind: "parent" });
    } else if (e.kind === "child") {
      const label = target.gender === "MALE" ? { name: "son", urdu: "بیٹا" } : { name: "daughter", urdu: "بیٹی" };
      steps.push({ memberId: e.via, name: label.name, urdu: label.urdu, kind: "child" });
    } else if (e.kind === "spouse") {
      const label = target.gender === "MALE" ? { name: "husband", urdu: "شوہر" } : { name: "wife", urdu: "بیوی" };
      steps.push({ memberId: e.via, name: label.name, urdu: label.urdu, kind: "spouse" });
      sameBloodline = false;
    } else {
      const older = isOlder(target, from);
      const t = SIB_TERMS[g];
      const label = older === true ? t.elder : older === false ? t.younger : t.neutral;
      steps.push({ memberId: e.via, name: label.name, urdu: label.urdu, kind: "sibling" });
    }
  }

  // Direct / composite names via pattern matching on the path
  const kinds = foundPath.map((e) => e.kind);
  const targets = foundPath.map((e) => graph.memberById.get(e.via)!);
  const direct = nameFromPath(kinds, targets, from, graph);

  return {
    found: true,
    steps,
    pathIds,
    names: direct ? [direct.urdu] : steps.map((s) => s.urdu),
    directName: direct ? direct.name : null,
    score: Math.max(0, 100 - (foundPath.length - 1) * 20),
    sameBloodline,
  };
}

function nameFromPath(
  kinds: string[],
  targets: TreeMemberDto[],
  from: TreeMemberDto,
  _graph: TreeGraphData
): { name: string; urdu: string } | null {
  const g = (m: TreeMemberDto) => (m.gender === "MALE" ? "male" : "female");

  // parent / child
  if (kinds.length === 1 && kinds[0] === "parent") return PARENT_TERMS[g(targets[0])];
  if (kinds.length === 1 && kinds[0] === "child") {
    return targets[0].gender === "MALE" ? { name: "son", urdu: "بیٹا" } : { name: "daughter", urdu: "بیٹی" };
  }
  if (kinds.length === 1 && kinds[0] === "spouse") {
    return targets[0].gender === "MALE" ? { name: "husband", urdu: "شوہر" } : { name: "wife", urdu: "بیوی" };
  }
  if (kinds.length === 1 && kinds[0] === "sibling") {
    const older = isOlder(targets[0], from);
    const t = SIB_TERMS[g(targets[0])];
    return older === true ? t.elder : older === false ? t.younger : t.neutral;
  }

  // grandparents: parent + parent
  if (kinds.length === 2 && kinds[0] === "parent" && kinds[1] === "parent") {
    const side = g(targets[0]) === "male" ? "P" : "M";
    return GRAND_TERMS[side][g(targets[1])];
  }

  // grandchildren: child + child
  if (kinds.length === 2 && kinds[0] === "child" && kinds[1] === "child") {
    return OTHER_TERMS.grandchild[g(targets[1])];
  }

  // uncles/aunts: parent + sibling
  if (kinds.length === 2 && kinds[0] === "parent" && kinds[1] === "sibling") {
    const side = g(targets[0]) === "male" ? "P" : "M";
    const u = UNCLE_AUNT_TERMS[side];
    const older = isOlder(targets[1], targets[0]);
    if (targets[1].gender === "MALE") {
      const t = u.male;
      return older === true ? t.elder : older === false ? t.younger : t.neutral;
    }
    return u.female.neutral;
  }

  // aunt/uncle spouses: parent + sibling + spouse
  if (kinds.length === 3 && kinds[0] === "parent" && kinds[1] === "sibling" && kinds[2] === "spouse") {
    const side = g(targets[0]) === "male" ? "P" : "M";
    if (side === "P") {
      if (targets[1].gender === "MALE") {
        const older = isOlder(targets[1], targets[0]);
        return older === true
          ? { name: "taya's wife (tai)", urdu: "تائی" }
          : { name: "chacha's wife (chachi)", urdu: "چاچی" };
      }
      return { name: "phuppho's husband (phuppha)", urdu: "پھوپھا" };
    }
    if (targets[1].gender === "MALE") return { name: "mamoon's wife (mumani)", urdu: "ممانی / مامی" };
    return { name: "khala's husband (khalo)", urdu: "خالو" };
  }

  // cousins: parent + sibling + child
  if (kinds.length === 3 && kinds[0] === "parent" && kinds[1] === "sibling" && kinds[2] === "child") {
    const side = g(targets[0]) === "male" ? "P" : "M";
    const sg = targets[1].gender === "MALE" ? "M" : "F";
    const key = `${side}_${sg}` as keyof typeof COUSIN_TERMS;
    return COUSIN_TERMS[key]?.[g(targets[2])] ?? null;
  }

  // nieces/nephews: sibling + child
  if (kinds.length === 2 && kinds[0] === "sibling" && kinds[1] === "child") {
    const key = g(targets[0]) === "male" ? "brother_child" : "sister_child";
    return NIECE_NEPHEW_TERMS[key][g(targets[1])];
  }

  // in-laws: spouse + parent / child + spouse
  if (kinds.length === 2 && kinds[0] === "spouse" && kinds[1] === "parent") {
    const side = g(targets[0]);
    return side === "male" ? IN_LAW_TERMS.wife_father : IN_LAW_TERMS.wife_mother;
  }
  if (kinds.length === 2 && kinds[0] === "child" && kinds[1] === "spouse") {
    return targets[0].gender === "MALE" ? IN_LAW_TERMS.son_wife : IN_LAW_TERMS.daughter_husband;
  }

  // sibling in-laws: sibling + spouse (brother's wife / sister's husband)
  if (kinds.length === 2 && kinds[0] === "sibling" && kinds[1] === "spouse") {
    return g(targets[0]) === "male" ? IN_LAW_TERMS.brother_wife : IN_LAW_TERMS.sister_husband;
  }
  // spouse + sibling (wife's brother/sister, husband's brother/sister)
  if (kinds.length === 2 && kinds[0] === "spouse" && kinds[1] === "sibling") {
    const sg = g(targets[1]);
    if (sg === "male") {
      const older = isOlder(targets[1], targets[0]);
      if (from.gender === "FEMALE") {
        return older === true ? IN_LAW_TERMS.husband_elder_brother : IN_LAW_TERMS.husband_brother;
      }
      return IN_LAW_TERMS.wife_brother;
    }
    if (from.gender === "FEMALE") return IN_LAW_TERMS.husband_sister;
    return IN_LAW_TERMS.wife_sister;
  }

  return null;
}
