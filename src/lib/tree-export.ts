import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

  // PDF via pdf-lib — pure JS, standard fonts embedded, no runtime font
  // modules (pdfkit's "#standard-fonts" imports break on serverless).
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([Math.min(W + 40, 14400), Math.min(H + 40, 14400)]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const hex = (h: string) => {
    const v = h.replace("#", "");
    return rgb(parseInt(v.slice(0, 2), 16) / 255, parseInt(v.slice(2, 4), 16) / 255, parseInt(v.slice(4, 6), 16) / 255);
  };
  // pdf-lib y-axis is bottom-up; layout coords are top-down
  const py = (y: number) => H - y;
  // WinAnsi-safe text (Helvetica standard encoding — no Urdu/emoji glyphs)
  const win = (t: string) =>
    Array.from(t).map((ch) => (ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) < 0xff ? ch : "?")).join("");

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hex("#fafafa") });
  for (const b of layout.buses) {
    const meta = REL_TYPE_META[b.type] ?? REL_TYPE_META.BIOLOGICAL;
    const dash = meta.dash ? meta.dash.split(",").map(Number) : undefined;
    for (let i = 0; i + 1 < b.points.length; i++) {
      page.drawLine({
        start: { x: b.points[i].x + pad, y: py(b.points[i].y + pad) },
        end: { x: b.points[i + 1].x + pad, y: py(b.points[i + 1].y + pad) },
        thickness: 2,
        color: hex(meta.stroke),
        dashArray: dash,
        lineCap: 1,
      });
    }
  }
  for (const m of layout.marriages) {
    const color = m.status === "MARRIED" ? MARRIAGE_COLOR : "#9ca3af";
    const x1 = Math.min(m.x1, m.x2) + pad;
    const x2 = Math.max(m.x1, m.x2) + pad;
    const yy = m.y1 + pad;
    page.drawLine({ start: { x: x1, y: py(yy - 3) }, end: { x: x2, y: py(yy - 3) }, thickness: 1.5, color: hex(color) });
    page.drawLine({ start: { x: x1, y: py(yy + 3) }, end: { x: x2, y: py(yy + 3) }, thickness: 1.5, color: hex(color) });
    if (m.status === "DIVORCED") {
      const mx = (m.x1 + m.x2) / 2 + pad;
      page.drawLine({ start: { x: mx - 5, y: py(yy - 5) }, end: { x: mx + 5, y: py(yy + 5) }, thickness: 2, color: hex("#6b7280") });
      page.drawLine({ start: { x: mx - 5, y: py(yy + 5) }, end: { x: mx + 5, y: py(yy - 5) }, thickness: 2, color: hex("#6b7280") });
    }
  }
  for (const n of Array.from(layout.nodes.values())) {
    const member = graph.memberById.get(n.id);
    if (!member) continue;
    const deceased = !member.isAlive || Boolean(member.dateOfDeath);
    const border = deceased ? DECEASED_COLOR : GENDER_COLORS[member.gender] ?? "#6b7280";
    const x = n.cx - NODE_W / 2 + pad;
    const y = n.cy - NODE_H / 2 + pad;
    // rounded node card via svg path (drawRectangle has no radius option)
    page.drawSvgPath(
      `M 12 0 H ${NODE_W - 12} A 12 12 0 0 1 ${NODE_W} 12 V ${NODE_H - 12} A 12 12 0 0 1 ${NODE_W - 12} ${NODE_H} H 12 A 12 12 0 0 1 0 ${NODE_H - 12} V 12 A 12 12 0 0 1 12 0 Z`,
      { x, y: py(y + NODE_H), borderColor: hex(border), borderWidth: 3, color: hex("#ffffff") }
    );
    page.drawCircle({ x: x + 30, y: py(y + 28), size: 40, borderColor: hex(border), borderWidth: 1.5 });
    const initialsText = win(initials(member));
    const iw = font.widthOfTextAtSize(initialsText, 13);
    page.drawText(initialsText, { x: x + 30 - iw / 2, y: py(y + 21), size: 13, font, color: hex(border) });
    const nameText = win(fullName(member)).slice(0, 16);
    page.drawText(nameText, { x: x + 58, y: py(y + 20), size: 14, font, color: hex("#111827") });
    const dates = member.dateOfBirth ? `${new Date(member.dateOfBirth).getFullYear()}${member.dateOfDeath ? "–" + new Date(member.dateOfDeath).getFullYear() : ""}` : "";
    if (dates) page.drawText(dates, { x: x + 58, y: py(y + 40), size: 12, font, color: hex("#6b7280") });
    if (deceased) {
      // small gray candle marker (standard fonts have no emoji glyphs)
      const cx = x + NODE_W - 16, cy = py(y + NODE_H - 10);
      page.drawCircle({ x: cx, y: cy, size: 10, borderColor: hex("#9ca3af"), borderWidth: 1 });
    }
  }
  page.drawText(win(data.tree.name), { x: 40, y: py(20), size: 16, font, color: hex("#111827") });
  page.drawText(`Digital Family Tree — ${new Date().toLocaleDateString("en-GB")} — ${data.members.length} members`, { x: 40, y: py(40), size: 10, font, color: hex("#6b7280") });
  const pdf = Buffer.from(await pdfDoc.save());
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
