import sharp from "sharp";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { buildTreeGraph } from "@/lib/tree-graph";
import { layoutTree } from "@/lib/tree-layout";
import {
  DECEASED_COLOR,
  GENDER_COLORS,
  MARRIAGE_COLOR,
  NODE_H,
  NODE_W,
  REL_TYPE_META,
  fullName,
  initials,
} from "@/lib/tree-utils";
import { resolveRelationship } from "@/lib/relationship-names";

// ============================================================
// TREE EXPORT — GEDCOM 5.5.1, JSON, PDF, PNG.
// PNG rendered from an SVG snapshot via sharp; PDF via pdfkit
// primitives from the same layout geometry.
// ============================================================

export interface ExportData {
  tree: { id: string; name: string; description: string | null };
  members: any[];
  relationships: any[];
  marriages: any[];
}

async function loadTree(treeId: string): Promise<ExportData> {
  const tree = await prisma.familyTree.findUnique({
    where: { id: treeId },
    select: { id: true, name: true, description: true },
  });
  if (!tree) throw new Error("درخت نہیں ملا");
  const [members, relationships, marriages] = await Promise.all([
    prisma.familyMember.findMany({ where: { treeId } }),
    prisma.relationship.findMany({ where: { treeId } }),
    prisma.marriage.findMany({ where: { treeId } }),
  ]);
  return { tree, members, relationships, marriages };
}

export function toGedcom(data: ExportData): string {
  const out: string[] = [];
  const esc = (s: string) => s.replace(/@/g, "@@");
  out.push("0 HEAD");
  out.push("1 SOUR DIGITAL-KHANDAAN");
  out.push("1 GEDC");
  out.push("2 VERS 5.5.1");
  out.push("2 FORM LINEAGE-LINKED");
  out.push("1 CHAR UTF-8");
  out.push("1 LANG ur");
  const famMap = new Map<string, string[]>(); // memberId -> FAM xrefs
  data.marriages.forEach((m, i) => {
    const xref = `F${i + 1}`;
    famMap.set(`${m.spouse1Id}|${m.spouse2Id}`, [xref]);
    out.push(`0 @${xref}@ FAM`);
    out.push(`1 HUSB @${m.spouse1Id}@`);
    out.push(`1 WIFE @${m.spouse2Id}@`);
    if (m.date) out.push(`1 MARR`);
    if (m.date) out.push(`2 DATE ${new Date(m.date).toISOString().slice(0, 10).replace(/-/g, " ").split(" ").reverse().join(" ")}`);
    if (m.location) out.push(`1 MARR`);
    if (m.location) out.push(`2 PLAC ${esc(m.location)}`);
    if (m.status === "DIVORCED") out.push("1 DIV");
    const kids = new Set<string>();
    for (const r of data.relationships) {
      if ((r.parentId === m.spouse1Id || r.parentId === m.spouse2Id) && !kids.has(r.childId)) {
        kids.add(r.childId);
        out.push(`1 CHIL @${r.childId}@`);
      }
    }
  });
  for (const m of data.members) {
    out.push(`0 @${m.id}@ INDI`);
    out.push(`1 NAME ${esc(m.firstName)} /${esc(m.lastName ?? "")}/`);
    if (m.nickName) out.push(`1 NICK ${esc(m.nickName)}`);
    out.push(`1 SEX ${m.gender === "MALE" ? "M" : m.gender === "FEMALE" ? "F" : "U"}`);
    if (m.dateOfBirth) {
      out.push("1 BIRT");
      const d = new Date(m.dateOfBirth);
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      out.push(`2 DATE ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`);
      if (m.birthPlace) out.push(`2 PLAC ${esc(m.birthPlace)}`);
    }
    if (m.dateOfDeath) {
      out.push("1 DEAT");
      const d = new Date(m.dateOfDeath);
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      out.push(`2 DATE ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`);
      if (m.deathPlace) out.push(`2 PLAC ${esc(m.deathPlace)}`);
    }
    if (m.occupation) out.push(`1 OCCU ${esc(m.occupation)}`);
    if (m.education) out.push(`1 EDUC ${esc(m.education)}`);
    if (m.bio) out.push(`1 NOTE ${esc(m.bio.replace(/\n/g, " "))}`);
  }
  out.push("0 TRLR");
  return out.join("\n");
}

export async function exportTree(treeId: string, format: "gedcom" | "json" | "pdf" | "png"): Promise<{ data: Buffer; filename: string; contentType: string }> {
  const data = await loadTree(treeId);
  const safeName = data.tree.name.replace(/[^\w\u0600-\u06FF-]+/g, "_").slice(0, 60);

  if (format === "gedcom") {
    const text = toGedcom(data);
    return { data: Buffer.from(text, "utf-8"), filename: `${safeName}.ged`, contentType: "application/octet-stream" };
  }

  if (format === "json") {
    const graph = buildTreeGraph(data.members, data.relationships, data.marriages);
    const relatives: Record<string, any> = {};
    for (const m of data.members) {
      const parents = graph.parentIdsOf.get(m.id) ?? [];
      const children = graph.childrenIdsOf.get(m.id) ?? [];
      const spouses = graph.spousesOf(m.id).map((s) => ({
        id: s.spouse.id,
        name: fullName(s.spouse),
        marriage: s.marriage,
      }));
      relatives[m.id] = { parents, children, spouses };
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "Digital Family Tree",
      tree: data.tree,
      members: data.members,
      relationships: data.relationships,
      marriages: data.marriages,
      relatives,
    };
    return {
      data: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
      filename: `${safeName}.json`,
      contentType: "application/json",
    };
  }

  // PDF / PNG — shared geometry
  const graph = buildTreeGraph(data.members, data.relationships, data.marriages);
  const layout = layoutTree(graph, { rootId: data.tree.id ? (graph.roots[0] ?? null) : graph.roots[0] ?? null, malesFirst: true, direction: "TB" });
  const pad = 60;
  const W = Math.max(layout.bounds.width + pad * 2, 400);
  const H = Math.max(layout.bounds.height + pad * 2, 300);

  const buildSvg = (): string => {
    const parts: string[] = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
    parts.push(`<rect width="${W}" height="${H}" fill="#fafafa"/>`);
    // buses
    for (const b of layout.buses) {
      const meta = REL_TYPE_META[b.type] ?? REL_TYPE_META.BIOLOGICAL;
      const d = b.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x + pad} ${p.y + pad}`).join(" ");
      parts.push(`<path d="${d}" fill="none" stroke="${meta.stroke}" stroke-width="2" stroke-dasharray="${meta.dash || ""}"/>`);
    }
    // marriages
    for (const m of layout.marriages) {
      const x1 = Math.min(m.x1, m.x2) + pad;
      const x2 = Math.max(m.x1, m.x2) + pad;
      const color = m.status === "MARRIED" ? MARRIAGE_COLOR : "#9ca3af";
      parts.push(`<line x1="${x1}" y1="${m.y1 + pad - 3}" x2="${x2}" y2="${m.y1 + pad - 3}" stroke="${color}" stroke-width="1.5"/>`);
      parts.push(`<line x1="${x1}" y1="${m.y1 + pad + 3}" x2="${x2}" y2="${m.y1 + pad + 3}" stroke="${color}" stroke-width="1.5"/>`);
      if (m.status === "DIVORCED") {
        const mx = (m.x1 + m.x2) / 2 + pad;
        parts.push(`<text x="${mx}" y="${m.y1 + pad}" font-size="12" text-anchor="middle">✗</text>`);
      }
    }
    // nodes
    for (const n of Array.from(layout.nodes.values())) {
      const member = graph.memberById.get(n.id);
      if (!member) continue;
      const deceased = !member.isAlive || Boolean(member.dateOfDeath);
      const border = deceased ? DECEASED_COLOR : GENDER_COLORS[member.gender] ?? "#6b7280";
      const x = n.cx - NODE_W / 2 + pad;
      const y = n.cy - NODE_H / 2 + pad;
      parts.push(`<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="12" fill="#fff" stroke="${border}" stroke-width="3"/>`);
      if (member.photo) {
        parts.push(`<clipPath id="clip-${member.id}"><circle cx="${x + 30}" cy="${y + 28}" r="20"/></clipPath>`);
        parts.push(`<image href="${member.photo}" x="${x + 10}" y="${y + 8}" width="40" height="40" preserveAspectRatio="xMidYMid slice" clip-path="url(#clip-${member.id})"/>`);
      } else {
        parts.push(`<circle cx="${x + 30}" cy="${y + 28}" r="20" fill="${border}22" stroke="${border}" stroke-width="1.5"/>`);
        parts.push(`<text x="${x + 30}" y="${y + 33}" font-size="13" font-weight="700" text-anchor="middle" fill="${border}">${initials(member)}</text>`);
      }
      parts.push(`<text x="${x + 58}" y="${y + 30}" font-size="14" font-weight="700" fill="#111827">${escapeXml(fullName(member)).slice(0, 16)}</text>`);
      const dates = member.dateOfBirth ? `${new Date(member.dateOfBirth).getFullYear()}${member.dateOfDeath ? "–" + new Date(member.dateOfDeath).getFullYear() : ""}` : "";
      if (dates) parts.push(`<text x="${x + 58}" y="${y + 48}" font-size="12" fill="#6b7280">${dates}</text>`);
      if (deceased) parts.push(`<text x="${x + NODE_W - 16}" y="${y + NODE_H - 10}" font-size="13">🕯️</text>`);
    }
    parts.push("</svg>");
    return parts.join("");
  };

  if (format === "png") {
    const svg = Buffer.from(buildSvg(), "utf-8");
    const png = await sharp(svg).png().toBuffer();
    return { data: png, filename: `${safeName}.png`, contentType: "image/png" };
  }

  // PDF via pdfkit
  const doc = new PDFDocument({ size: [Math.min(W + 40, 14400), Math.min(H + 40, 14400)], margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  doc.rect(0, 0, W, H).fill("#fafafa");
  doc.lineCap("round").lineJoin("round");
  for (const b of layout.buses) {
    const meta = REL_TYPE_META[b.type] ?? REL_TYPE_META.BIOLOGICAL;
    const dashPattern = meta.dash ? meta.dash.split(",").map(Number) : null;
    doc.strokeColor(meta.stroke).lineWidth(2);
    if (dashPattern) (doc as any).dash(dashPattern);
    doc.moveTo(b.points[0].x + pad, b.points[0].y + pad);
    for (const p of b.points.slice(1)) doc.lineTo(p.x + pad, p.y + pad);
    doc.stroke();
    if (dashPattern) doc.undash();
  }
  for (const m of layout.marriages) {
    const color = m.status === "MARRIED" ? MARRIAGE_COLOR : "#9ca3af";
    const x1 = Math.min(m.x1, m.x2) + pad;
    const x2 = Math.max(m.x1, m.x2) + pad;
    doc.strokeColor(color).lineWidth(1.5);
    doc.moveTo(x1, m.y1 + pad - 3).lineTo(x2, m.y1 + pad - 3).stroke();
    doc.moveTo(x1, m.y1 + pad + 3).lineTo(x2, m.y1 + pad + 3).stroke();
    if (m.status === "DIVORCED") {
      const mx = (m.x1 + m.x2) / 2 + pad;
      doc.strokeColor("#6b7280").lineWidth(2);
      doc.moveTo(mx - 5, m.y1 + pad - 5).lineTo(mx + 5, m.y1 + pad + 5).stroke();
      doc.moveTo(mx - 5, m.y1 + pad + 5).lineTo(mx + 5, m.y1 + pad - 5).stroke();
    }
  }
  for (const n of Array.from(layout.nodes.values())) {
    const member = graph.memberById.get(n.id);
    if (!member) continue;
    const deceased = !member.isAlive || Boolean(member.dateOfDeath);
    const border = deceased ? DECEASED_COLOR : GENDER_COLORS[member.gender] ?? "#6b7280";
    const x = n.cx - NODE_W / 2 + pad;
    const y = n.cy - NODE_H / 2 + pad;
    doc.roundedRect(x, y, NODE_W, NODE_H, 12).fillAndStroke("#ffffff", border).lineWidth(3);
    doc.strokeColor(border).lineWidth(1.5).circle(x + 30, y + 28, 20).stroke();
    doc.fillColor(border).fontSize(13).text(initials(member), x + 18, y + 21, { width: 24, align: "center" });
    doc.fillColor("#111827").fontSize(14).text(fullName(member).slice(0, 16), x + 58, y + 20, { width: NODE_W - 70 });
    const dates = member.dateOfBirth ? `${new Date(member.dateOfBirth).getFullYear()}${member.dateOfDeath ? "–" + new Date(member.dateOfDeath).getFullYear() : ""}` : "";
    if (dates) doc.fillColor("#6b7280").fontSize(12).text(dates, x + 58, y + 40);
  }
  doc.fillColor("#111827").fontSize(16).text(data.tree.name, 40, 20);
  doc.fillColor("#6b7280").fontSize(10).text(`Digital Family Tree — ${new Date().toLocaleDateString("en-GB")} — ${data.members.length} members`, 40, 40);
  doc.end();
  const pdf = await done;
  return { data: pdf, filename: `${safeName}.pdf`, contentType: "application/pdf" };
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function relationshipReport(graph: ReturnType<typeof buildTreeGraph>, memberId: string): any[] {
  const m = graph.memberById.get(memberId);
  if (!m) return [];
  return graph.members
    .filter((x) => x.id !== memberId)
    .map((x) => ({
      from: memberId,
      to: x.id,
      name: fullName(x),
      ...resolveRelationship(m, x, graph),
    }))
    .filter((r) => r.found);
}
