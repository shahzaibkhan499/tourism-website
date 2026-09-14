// ============================================================
// Digital Khandaan — 1000+ NODE LAYOUT VERIFIER
// Loads the stress tree seeded by prisma/seed-1000-tree.ts, runs the
// production layout engine (Buchheim-style) on it, and asserts:
//  1. 1000+ members, 7+ generations, polygamy/divorce/deceased present
//  2. ZERO overlapping node boxes
//  3. Marriage lines: horizontal, edge-to-edge between spouse cards
//  4. Child buses: orthogonal solid segments, drop from the marriage
//     midpoint, every drop lands on its child's card top edge
//  5. Children of a polygamous father sit under THEIR OWN mother's
//     column (buses never interleave)
//  6. Children strictly below parents; graph fully connected
// Run: npx tsx prisma/verify-1000-layout.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
import { buildTreeGraph } from "../src/lib/tree-graph";
import { layoutTree } from "../src/lib/tree-layout";
import { NODE_H, NODE_W } from "../src/lib/tree-utils";

const prisma = new PrismaClient();
const EPS = 0.5;

let checks = 0;
let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  checks += 1;
  if (ok) {
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures += 1;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("🔍 Verifying 1000+ node layout...\n");

  const user = await prisma.user.findUnique({ where: { email: "seed-1000@example.com" } });
  if (!user) throw new Error("Seed user missing — run prisma/seed-1000-tree.ts first");
  const tree = await prisma.familyTree.findFirst({ where: { creatorId: user.id } });
  if (!tree) throw new Error("Stress tree missing — run prisma/seed-1000-tree.ts first");

  const members = await prisma.familyMember.findMany({ where: { treeId: tree.id } });
  const rels = await prisma.relationship.findMany({ where: { treeId: tree.id } });
  const marrs = await prisma.marriage.findMany({ where: { treeId: tree.id } });

  // ---------- 1. Data requirements ----------
  check("1000+ members", members.length >= 1000, `${members.length} members`);
  const maxGen = Math.max(...members.map((m) => m.generation));
  check("7+ generations", maxGen >= 7, `${maxGen} generations`);

  const marriagesOf = new Map<string, number>();
  for (const m of marrs) {
    marriagesOf.set(m.spouse1Id, (marriagesOf.get(m.spouse1Id) ?? 0) + 1);
  }
  const polyMales = Array.from(marriagesOf.entries()).filter(([, n]) => n >= 3);
  check("polygamy present (1 man, 3 wives)", polyMales.length > 0, `${polyMales.length} males with 3+ wives`);
  check("divorces present", marrs.some((m) => m.status === "DIVORCED"), `${marrs.filter((m) => m.status === "DIVORCED").length}`);
  check("widowed present", marrs.some((m) => m.status === "WIDOWED"), `${marrs.filter((m) => m.status === "WIDOWED").length}`);
  check("deceased present", members.some((m) => m.dateOfDeath), `${members.filter((m) => m.dateOfDeath).length}`);

  // ---------- Build production graph + layout ----------
  const memberDtos = members.map((m) => ({
    id: m.id,
    treeId: m.treeId,
    userId: m.userId,
    firstName: m.firstName,
    lastName: m.lastName,
    nickName: m.nickName,
    gender: m.gender,
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
    dateOfDeath: m.dateOfDeath ? m.dateOfDeath.toISOString() : null,
    isAlive: !m.dateOfDeath,
    photo: m.photo,
    birthPlace: m.birthPlace,
    deathPlace: m.deathPlace,
    currentCity: m.currentCity,
    occupation: m.occupation,
    education: m.education,
    bio: m.bio,
    phone: m.phone,
    email: m.email,
    generation: m.generation,
    sortOrder: m.sortOrder,
    isPrivate: m.isPrivate ?? false,
    showInPublic: m.showInPublic ?? true,
    positionX: m.positionX,
    positionY: m.positionY,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));
  const relDtos = rels.map((r) => ({ id: r.id, parentId: r.parentId, childId: r.childId, type: r.type, treeId: r.treeId }));
  const marrDtos = marrs.map((m) => ({
    id: m.id,
    spouse1Id: m.spouse1Id,
    spouse2Id: m.spouse2Id,
    treeId: m.treeId,
    date: m.date ? m.date.toISOString() : null,
    endDate: m.endDate ? m.endDate.toISOString() : null,
    location: m.location,
    status: m.status,
    type: m.type,
    sortOrder: m.sortOrder,
  }));

  const graph = buildTreeGraph(memberDtos, relDtos, marrDtos);
  const layout = layoutTree(graph, { rootId: tree.rootMemberId, malesFirst: true, direction: "TB" });

  const nodes = Array.from(layout.nodes.values());
  check("all members placed", nodes.length === members.length, `${nodes.length}/${members.length}`);
  check("all coordinates finite", nodes.every((n) => Number.isFinite(n.cx) && Number.isFinite(n.cy)) &&
    layout.marriages.every((m) => [m.x1, m.y1, m.x2, m.y2].every(Number.isFinite)) &&
    layout.buses.every((b) => b.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))));

  // ---------- 2. No overlapping nodes (O(n log n) sweep) ----------
  const sorted = Array.from(nodes).sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  let overlaps = 0;
  const box = (cx: number, cy: number) => ({ x1: cx - NODE_W / 2, x2: cx + NODE_W / 2, y1: cy - NODE_H / 2, y2: cy + NODE_H / 2 });
  for (let i = 0; i < sorted.length; i++) {
    const A = box(sorted[i].cx, sorted[i].cy);
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].cx - sorted[i].cx >= NODE_W) break; // too far right to ever overlap
      const B = box(sorted[j].cx, sorted[j].cy);
      if (Math.abs(sorted[j].cy - sorted[i].cy) < NODE_H) {
        // same vertical band → horizontal separation must hold
        if (Math.abs(sorted[j].cx - sorted[i].cx) < NODE_W) overlaps += 1;
      }
      void B;
    }
    void A;
  }
  check("ZERO overlapping node boxes", overlaps === 0, overlaps === 0 ? `${nodes.length} nodes swept` : `${overlaps} overlaps!`);

  // ---------- 3. Marriage lines: horizontal, edge-to-edge ----------
  const placed = layout.nodes;
  // Marriage lines: horizontal (y1 === y2), edge-to-edge between the two
  // spouse cards, and on the anchor's row. Multi-marriage lines carry small
  // vertical offsets (±16px per spouse column) so they never overlap — the
  // line must still stay inside the anchor card (NODE_H/2 = 45px half-height).
  const marrById = new Map(marrs.map((m) => [m.id, m]));
  let badLines = 0;
  for (const ml of layout.marriages) {
    const rec = marrById.get(ml.id);
    const horizontal = Math.abs(ml.y1 - ml.y2) <= EPS;
    if (!horizontal) { badLines += 1; continue; }
    if (!rec) { continue; } // synthetic join line — geometry-only
    const a = placed.get(rec.spouse1Id);
    const b = placed.get(rec.spouse2Id);
    if (!a || !b) { badLines += 1; continue; }
    const lo = Math.min(a.cx, b.cx);
    const hi = Math.max(a.cx, b.cx);
    const anchorY = a.cy; // s1 is always the anchor (male) in this engine
    const edgeToEdge = Math.abs(ml.x1 - (lo + NODE_W / 2)) <= EPS && Math.abs(ml.x2 - (hi - NODE_W / 2)) <= EPS;
    const onRow = Math.abs(ml.y1 - anchorY) <= NODE_H / 2;
    if (!edgeToEdge || !onRow) badLines += 1;
  }
  check("marriage lines solid (horizontal, edge-to-edge, within anchor card)", badLines === 0,
    badLines === 0 ? `${layout.marriages.length} lines` : `${badLines} broken of ${layout.marriages.length}`);

  // ---------- 4. Child buses: orthogonal + connected ----------
  let badBuses = 0;
  let disconnectedDrops = 0;
  const parentIdsOf = graph.parentIdsOf;
  for (const bus of layout.buses) {
    const pts = bus.points;
    if (pts.length < 2) { badBuses += 1; continue; }
    // orthogonal consecutive segments (solid L-strokes, no diagonals)
    for (let i = 0; i < pts.length - 1; i++) {
      const sameX = Math.abs(pts[i].x - pts[i + 1].x) <= EPS;
      const sameY = Math.abs(pts[i].y - pts[i + 1].y) <= EPS;
      if (!(sameX || sameY)) { badBuses += 1; break; }
    }
    // first point = marriage midpoint (couple) or parent center (single)
    const family = graph.familyByKey.get(bus.familyKey);
    if (!family) { badBuses += 1; continue; }
    const parents = family.parentIds.map((id) => placed.get(id)).filter(Boolean) as { cx: number; cy: number }[];
    const children = family.childIds;
    if (parents.length === 0 || children.length === 0) { badBuses += 1; continue; }
    const expectStartX = parents.length === 1
      ? parents[0].cx
      : (parents[0].cx + parents[parents.length - 1].cx) / 2;
    if (Math.abs(pts[0].x - expectStartX) > EPS) badBuses += 1;
    // per-child drops: every child of the family must have a drop ending at its card top
    const childTopY = Math.min(...children.map((c) => placed.get(c)?.cy ?? Infinity)) - NODE_H / 2;
    for (const cid of children) {
      const c = placed.get(cid);
      if (!c) { disconnectedDrops += 1; continue; }
      const dropAtX = pts.some((p, i) => Math.abs(p.x - c.cx) <= EPS && i + 1 < pts.length &&
        Math.abs(pts[i + 1].y - childTopY) <= EPS && Math.abs(pts[i + 1].x - c.cx) <= EPS);
      if (!dropAtX) disconnectedDrops += 1;
    }
    void parentIdsOf;
  }
  check("buses orthogonal (solid L segments, no diagonals)", badBuses === 0, badBuses === 0 ? `${layout.buses.length} buses` : `${badBuses} broken`);
  check("every child drop lands on its card top edge", disconnectedDrops === 0,
    disconnectedDrops === 0 ? `${layout.buses.length} buses` : `${disconnectedDrops} floating drops`);

  // ---------- 5. Polygamy: children under their specific mother ----------
  let polyChecked = 0;
  let polyInterleaved = 0;
  for (const [maleId, n] of polyMales) {
    if (n < 2) continue;
    const wifeFams = graph.families.filter((f) => f.parentIds.includes(maleId) && f.parentIds.length === 2);
    if (wifeFams.length < 2) continue;
    polyChecked += 1;
    // order wife-families by the wife's x, check child x-ranges don't interleave
    const ordered = wifeFams
      .map((f) => {
        const motherId = f.parentIds.find((p) => p !== maleId)!;
        const mother = placed.get(motherId);
        const kids = f.childIds.map((c) => placed.get(c)?.cx ?? NaN).filter(Number.isFinite);
        return { mother, motherId, minX: Math.min(...kids), maxX: Math.max(...kids), kids };
      })
      .filter((f) => f.kids.length > 0 && f.mother)
      .sort((a, b) => (a.mother!.cx) - (b.mother!.cx));
    for (let i = 0; i + 1 < ordered.length; i++) {
      if (ordered[i].maxX >= ordered[i + 1].minX) polyInterleaved += 1;
    }
  }
  check("polygamous children under their own mother (no interleaving)", polyChecked > 0 && polyInterleaved === 0,
    polyChecked > 0 ? `${polyChecked} poly families verified${polyInterleaved ? `, ${polyInterleaved} interleaved!` : ""}` : "none found");

  // ---------- 6. Children strictly below parents + connectivity ----------
  let above = 0;
  for (const r of rels) {
    const p = placed.get(r.parentId);
    const c = placed.get(r.childId);
    if (!p || !c) continue;
    if (c.cy - p.cy < NODE_H - EPS) above += 1;
  }
  check("children strictly below parents (>= NODE_H gap)", above === 0, above === 0 ? `${rels.length} links` : `${above} violating`);

  // No two nodes may share the exact same X AND Y coordinate (prompt assertion)
  const posKey = new Set<string>();
  let dupPos = 0;
  for (const n of nodes) {
    const key = `${Math.round(n.cx * 10)}:${Math.round(n.cy * 10)}`;
    if (posKey.has(key)) dupPos += 1;
    posKey.add(key);
  }
  check("no nodes share the same X and Y coordinate", dupPos === 0, dupPos === 0 ? `${nodes.length} unique positions` : `${dupPos} duplicates`);

  // Wives share the SAME Y as their husbands (spouses sit on one row)
  let spousesOffRow = 0;
  for (const m of marrs) {
    const a = placed.get(m.spouse1Id);
    const b = placed.get(m.spouse2Id);
    if (!a || !b) continue;
    if (Math.abs(a.cy - b.cy) > EPS) spousesOffRow += 1;
  }
  check("wives share the same Y as husbands", spousesOffRow === 0,
    spousesOffRow === 0 ? `${marrs.length} marriages on shared rows` : `${spousesOffRow} off-row`);

  // Vertical hierarchy (exact): every parent-child link must move EXACTLY
  // one row down (child.depth === parent.depth + 1), and every married
  // couple must sit on the SAME row. Together these prove the Y-axis is
  // strict generation math (root 0, each generation +1 row, spouses same Y).
  let depthLinkViolations = 0;
  for (const r of rels) {
    const p = placed.get(r.parentId);
    const c = placed.get(r.childId);
    if (!p || !c) continue;
    if (c.depth !== p.depth + 1) depthLinkViolations += 1;
  }
  check("every parent-child link moves exactly one row down", depthLinkViolations === 0,
    depthLinkViolations === 0 ? `${rels.length} links` : `${depthLinkViolations} violating`);

  let coupleDepthViolations = 0;
  for (const m of marrs) {
    const a = placed.get(m.spouse1Id);
    const b = placed.get(m.spouse2Id);
    if (!a || !b) continue;
    if (a.depth !== b.depth) coupleDepthViolations += 1;
  }
  check("every married couple shares the same layout row", coupleDepthViolations === 0,
    coupleDepthViolations === 0 ? `${marrs.length} couples` : `${coupleDepthViolations} violating`);

  // connectivity BFS from roots
  const seen = new Set<string>();
  const q = [...layout.rootIds];
  while (q.length > 0) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const c of graph.childrenIdsOf.get(id) ?? []) q.push(c);
  }
  check("graph fully connected from root(s)", seen.size === members.length, `${seen.size}/${members.length}`);

  const spouseSet = new Set<string>();
  for (const m of marrs) { spouseSet.add(m.spouse1Id); spouseSet.add(m.spouse2Id); }
  const everyNonRootConnected = members.every(
    (m) => m.id === tree.rootMemberId || (graph.parentIdsOf.get(m.id) ?? []).length > 0 || spouseSet.has(m.id)
  );
  check("no floating members (parent-linked or married-in)", everyNonRootConnected);

  // ---------- Result ----------
  console.log(`\n${failures === 0 ? "🎉 LAYOUT VERIFICATION PASS" : "💥 LAYOUT VERIFICATION FAILED"}: ${checks - failures}/${checks} checks`);
  console.log(`📐 bounds: ${Math.round(layout.bounds.width)} × ${Math.round(layout.bounds.height)} px`);
  if (failures > 0) process.exit(1);
  await prisma.$disconnect();
}


main().catch(async (e) => {
  console.error("❌ Verification crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
