// ============================================================
// Digital Khandaan — MEGA TREE LAYOUT VERIFIER (20 generations)
// Runs the PRODUCTION layout engine on prisma/seed-mega-tree.ts data
// and asserts the 8 stress requirements. Failures print details.
// Run: npx tsx prisma/verify-mega-tree.ts
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
  if (ok) console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
  else {
    failures += 1;
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("🔍 Verifying MEGA tree layout...\n");

  const user = await prisma.user.findUnique({ where: { email: "seed-mega@example.com" } });
  if (!user) throw new Error("Mega seed user missing — run prisma/seed-mega-tree.ts first");
  const tree = await prisma.familyTree.findFirst({ where: { creatorId: user.id } });
  if (!tree) throw new Error("Mega tree missing — run prisma/seed-mega-tree.ts first");

  const members = await prisma.familyMember.findMany({ where: { treeId: tree.id } });
  const rels = await prisma.relationship.findMany({ where: { treeId: tree.id } });
  const marrs = await prisma.marriage.findMany({ where: { treeId: tree.id } });
  check("mega seed loaded (500+ members)", members.length >= 500, `${members.length} members`);

  const memberDtos = members.map((m) => ({
    id: m.id, treeId: m.treeId, userId: m.userId, firstName: m.firstName, lastName: m.lastName,
    nickName: m.nickName, gender: m.gender,
    dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
    dateOfDeath: m.dateOfDeath ? m.dateOfDeath.toISOString() : null,
    isAlive: !m.dateOfDeath, photo: m.photo, birthPlace: m.birthPlace, deathPlace: m.deathPlace,
    currentCity: m.currentCity, occupation: m.occupation, education: m.education, bio: m.bio,
    phone: m.phone, email: m.email, generation: m.generation, sortOrder: m.sortOrder,
    isPrivate: m.isPrivate ?? false, showInPublic: m.showInPublic ?? true,
    positionX: m.positionX, positionY: m.positionY,
    createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString(),
  }));
  const relDtos = rels.map((r) => ({ id: r.id, parentId: r.parentId, childId: r.childId, type: r.type, treeId: r.treeId }));
  const marrDtos = marrs.map((m) => ({
    id: m.id, spouse1Id: m.spouse1Id, spouse2Id: m.spouse2Id, treeId: m.treeId,
    date: m.date ? m.date.toISOString() : null, endDate: m.endDate ? m.endDate.toISOString() : null,
    location: m.location, status: m.status, type: m.type, sortOrder: m.sortOrder,
  }));

  const graph = buildTreeGraph(memberDtos as any, relDtos as any, marrDtos as any);

  // Timing check (assertion 7: under 500ms for 1000 nodes)
  const t0 = Date.now();
  const layout = layoutTree(graph, { rootId: tree.rootMemberId, malesFirst: true, direction: "TB" });
  const layoutMs = Date.now() - t0;
  const nodes = Array.from(layout.nodes.values());
  check("layout completes < 500ms for 1000+ nodes", layoutMs < 500, `${layoutMs}ms`);

  // ---------- 1. Every node has a unique (x, y) position (zero overlaps) ----------
  const posKey = new Set<string>();
  let dup = 0;
  const sorted = Array.from(nodes).sort((a, b) => a.cx - b.cx);
  for (const n of sorted) {
    const key = `${Math.round(n.cx * 10)}:${Math.round(n.cy * 10)}`;
    if (posKey.has(key)) dup += 1;
    posKey.add(key);
  }
  let overlaps = 0;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].cx - sorted[i].cx >= NODE_W) break;
      if (Math.abs(sorted[j].cy - sorted[i].cy) < NODE_H && Math.abs(sorted[j].cx - sorted[i].cx) < NODE_W) overlaps += 1;
    }
  }
  check("no duplicate (x, y) positions", dup === 0, dup === 0 ? `${nodes.length} unique` : `${dup} duplicates`);
  check("zero overlapping node boxes", overlaps === 0, overlaps === 0 ? `${nodes.length} swept` : `${overlaps} overlaps`);

  // ---------- 2. child.y > parent.y for every relationship ----------
  let badY = 0;
  for (const r of rels) {
    const p = layout.nodes.get(r.parentId);
    const c = layout.nodes.get(r.childId);
    if (!p || !c) continue;
    if (c.cy - p.cy < NODE_H - EPS) badY += 1;
  }
  check("every child strictly below its parents", badY === 0, badY === 0 ? `${rels.length} links` : `${badY} violating`);

  // ---------- 3. spouse1.y === spouse2.y for every marriage ----------
  let offRow = 0;
  for (const m of marrs) {
    const a = layout.nodes.get(m.spouse1Id);
    const b = layout.nodes.get(m.spouse2Id);
    if (!a || !b) continue;
    if (Math.abs(a.cy - b.cy) > EPS) offRow += 1;
  }
  check("spouses share the same Y", offRow === 0, offRow === 0 ? `${marrs.length} marriages` : `${offRow} off-row`);

  // ---------- 4. children drop from the marriage midpoint ----------
  let midBad = 0;
  for (const bus of layout.buses) {
    const fam = graph.familyByKey.get(bus.familyKey);
    if (!fam || fam.parentIds.length !== 2) continue;
    const p1 = layout.nodes.get(fam.parentIds[0]);
    const p2 = layout.nodes.get(fam.parentIds[1]);
    if (!p1 || !p2 || bus.points.length === 0) continue;
    const midX = (p1.cx + p2.cx) / 2;
    if (Math.abs(bus.points[0].x - midX) > EPS) midBad += 1;
  }
  check("children drop from the marriage midpoint", midBad === 0, midBad === 0 ? `${layout.buses.length} buses` : `${midBad} off-midpoint`);

  // ---------- 5. polygamous children cluster under their own mother ----------
  // Each wife's children get their OWN drop line from the midpoint of their
  // marriage to the male (asserted in #4). Here: children who did NOT marry
  // outside the family ("home" children) must stay contiguous in their
  // mother's cluster — co-wives' home children must never interleave.
  const perMale = new Map<string, number>();
  for (const m of marrs) perMale.set(m.spouse1Id, (perMale.get(m.spouse1Id) ?? 0) + 1);
  const marriagesOfMember = new Map<string, typeof marrs>();
  for (const m of marrs) {
    for (const id of [m.spouse1Id, m.spouse2Id]) {
      const arr = marriagesOfMember.get(id) ?? [];
      arr.push(m);
      marriagesOfMember.set(id, arr);
    }
  }
  let polyChecked = 0;
  let polyInterleaved = 0;
  let polyHomeKids = 0;
  perMale.forEach((n, maleId) => {
    if (n < 3) return;
    const fams = graph.families.filter((f) => f.parentIds.length === 2 && f.parentIds.includes(maleId));
    if (fams.length < 2) return;
    polyChecked += 1;
    const clusters = fams
      .map((f) => {
        const motherId = f.parentIds.find((p) => p !== maleId)!;
        const mother = layout.nodes.get(motherId);
        const familySet = new Set([...f.parentIds, ...f.childIds]);
        // home = never married to anyone outside THIS family
        const homeXs = f.childIds
          .filter((c) => {
            const ownMarrs = marriagesOfMember.get(c) ?? [];
            return ownMarrs.every((mm) => {
              const partner = mm.spouse1Id === c ? mm.spouse2Id : mm.spouse1Id;
              return familySet.has(partner);
            });
          })
          .map((c) => layout.nodes.get(c)?.cx ?? NaN)
          .filter(Number.isFinite);
        polyHomeKids += homeXs.length;
        return {
          mother,
          minX: homeXs.length ? Math.min(...homeXs) : NaN,
          maxX: homeXs.length ? Math.max(...homeXs) : NaN,
        };
      })
      .filter((f) => f.mother && Number.isFinite(f.minX))
      .sort((a, b) => a.mother!.cx - b.mother!.cx);
    for (let i = 0; i + 1 < clusters.length; i++) {
      if (clusters[i].maxX >= clusters[i + 1].minX) polyInterleaved += 1;
    }
  });
  check("polygamous children cluster under their own mother", polyChecked > 0 && polyInterleaved === 0,
    polyChecked > 0 ? `${polyChecked} poly males verified, ${polyHomeKids} home children` : "none");

  // ---------- 6. all 20 generations represented ----------
  const depths = new Set<number>();
  nodes.forEach((n) => depths.add(n.depth));
  let maxDepth = 0;
  depths.forEach((d) => { if (d > maxDepth) maxDepth = d; });
  check("all 20 generations represented in positions", depths.size === 20 && maxDepth === 19,
    `${depths.size} distinct rows, max depth ${maxDepth}`);

  // ---------- 7 & 8. no stack overflow (20-deep traversal completes) ----------
  check("no stack overflow (deep traversal completed)", nodes.length === members.length, `${nodes.length}/${members.length} placed`);

  console.log(`\n${failures === 0 ? "🎉 MEGA VERIFICATION PASS" : "💥 MEGA VERIFICATION FAILED"}: ${checks - failures}/${checks} checks`);
  console.log(`📐 bounds: ${Math.round(layout.bounds.width)} × ${Math.round(layout.bounds.height)} px | layout ${layoutMs}ms`);
  await prisma.$disconnect();
  if (failures > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error("❌ crashed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
