# Family Tree Module — Build Report

**Date:** 2026-09-11 · **Commits:** `0338547` (Steps 1–7), `ecfd81d` (Steps 8–22), `cb91211` (Steps 23–37)
**Status:** Steps 1–37 of 53 complete + runtime-verified. **NOT yet pushed/deployed** (live main = `4276de7`).

---

## ✅ 1. WHAT WAS MADE (per spec)

### Database (Step 1)
- 19 new models + 10 enums appended to `prisma/schema.prisma` (additive-only), 4 new User relations.
- Pushed to local PostgreSQL **and Neon live** (`familytree` DB). All `@@index`/`@@unique`/`onDelete: Cascade` per spec.

### Foundation (Step 2)
- `src/types/tree.ts` — all DTOs · `src/stores/tree-store.ts` — full Zustand UI state.

### APIs — ALL 41 spec endpoints + 5 photo endpoints built (~46 total)
| Area | Endpoints |
|---|---|
| Tree CRUD | GET/POST `/api/tree`, GET/PUT/DELETE `/api/tree/[treeId]` |
| Members | GET/POST members, PUT/DELETE `[memberId]`, PUT reorder |
| Relationships | POST, PUT/DELETE `[id]` (type change incl.) |
| Marriages | POST, PUT/DELETE `[id]` (divorce, dates) |
| Comments | GET/POST/PUT/DELETE `comments/[memberId]`, POST `react` (threaded + pinned + emoji) |
| Timeline | GET/POST `timeline/[memberId]` |
| Stories | GET/POST `stories/[memberId]` |
| Verify | POST `verify` |
| Invite | POST/GET `invite`, GET/POST `invite/[token]` (accept → collaborator / claim profile) |
| Collaborate | GET/POST/PUT/DELETE `collaborate` (VIEWER/EDITOR/ADMIN roles) |
| Merge | GET/POST `merge`, PUT `merge/[id]` (preview + execute in transaction) |
| Duplicates | GET `duplicates`, POST `duplicates/resolve` (MERGE/SKIP) |
| Calculator | POST `relationship-calc` (BFS + 50+ Urdu names) |
| Privacy | GET/PUT `privacy` (tree), POST `privacy` (member-level) |
| Stats | GET `stats` (demographics + chart data) |
| History/Undo | GET `history` (cursor paginated), POST `undo` |
| Compare | POST `compare` (side-by-side) |
| Import | POST `import` (GEDCOM/CSV multipart, 2MB + type validation) |
| Export | GET `export/[treeId]?format=gedcom\|json\|pdf\|png` |
| Photos (33a) | GET/POST/DELETE `photos`, POST/DELETE `photos/[photoId]/tags` (face tagging) |

### Pages (6)
`/tree` (list) · `/tree/create` · `/tree/[treeId]` (viewer) · `/tree/[treeId]/settings` (privacy + photos) · `/tree/[treeId]/collaborate` · `/tree/[treeId]/history` · `/tree/invite/[token]` (accept page)

### Components (30, one per file in /components/tree)
Viewer (D3 SVG zoom/pan/pinch), GenoPro-style layout (multi-wife mother columns, husband own slot), node/link/marriage rendering per spec colors, controls, search (debounced + prev/next), legend, minimap, context menu, stats bar, details sidebar (info/comments/timeline/stories tabs), add/edit member + marriage + relationship modals, delete-with-reassignment dialog, duplicate alert + manager, relationship calculator, member comparison, merge preview, invite modal + list, collaborator list, privacy settings, version history, import modal (CSV column mapping), export modal, group photos + face tagging, stats panel (Recharts: 6 charts).

### Libs (10)
`tree-utils` · `tree-graph` · `tree-layout` (Buchheim-style slot layout + 4 directions) · `tree-validators` (Zod) · `tree-access` (roles + privacy enforcement + versioning) · `duplicate-detection` (Levenshtein + 80/60 thresholds) · `relationship-names` (50+ Urdu rishte) · `tree-merge` · `gedcom-parser` (5.5.1) · `csv-parser` (mapping) · `tree-export` (4 formats via sharp + pdfkit)

### Spec scenarios verified LIVE
- **A** (1+1+3): parents above, children below marriage link ✅
- **B** (1 husband + 3 wives): Fatima | Ahmed | Ayesha | Zainab columns, children under own mother ✅
- **C** (sibling order): sortOrder → DOB oldest-left → gender → type → name ✅ (+ reorder API)
- **D** (merge): preview common members (name/DOB±2y/parents scoring) + execute + re-link ✅
- **E** (duplicates): 95 → BLOCK 409, 70 → WARN create, <60 allow ✅

---

## ⚠️ 2. WHAT WAS NOT MADE (gaps)

All Step 16/17/23a/11b UI gaps and Steps 38–44 are now **CLOSED** (commit a9248dc):

1. ✅ Marriage edit/divorce UI (Step 16) — `edit-marriage-modal` + `marriage-manager` (dates/status/type edit, divorce via DIVORCED, delete with confirm).
2. ✅ Relationship type-change/remove UI (Step 17) — `relationship-manager` (type change → ADOPTED etc., remove with confirm, cycle guard in API).
3. ✅ Verification badges UI (23a) — `verify-section` (verify/dispute buttons + badge counts on member panel).
4. ✅ Drag-to-reorder siblings UI (11b) — `sibling-reorder-dialog` (HTML5 drag + up/down arrows, boundary-disabled, PUT reorder).
5. ✅ Step 38 — generation-depth filter (`نسل N تک / تمام نسلیں`, default depth 4 for >200 members, "+N مزید ممبرز" button).
6. ✅ Step 39 — `canvas-tree-viewer` (dot grid, buses, marriage lines, LOD zoom tiers 0.5/0.6, click/context-menu hit-test; auto for >1000 members).
7. ✅ Step 43 — `tree-layout.worker.ts` (web worker for ≥1000 members, main-thread fallback) + SVG LOD (names/dates hidden below zoom 0.45).
8. ✅ Step 40 — N/P (search prev/next), B (fit), S (detail panel), Ctrl+F; +/−/arrows/R/Esc already done.
9. ✅ Step 41 — mobile bottom sheet detail panel (<1024px) + horizontal-scroll toolbars on small screens.
10. ✅ Step 42 — dark mode via `use-dark-mode` (MutationObserver) + `TREE_THEME` palettes across viewer/node/canvas/controls.
11. **Redo** — Undo works (13/13 edge tests); no redo (spec 30a mentions Undo/Redo but only `/undo` endpoint was specified).
12. **Deployment** — 4 commits local-only (0338547, ecfd81d, cb91211, a9248dc); needs fresh PAT + push + live verification.

---

## 🔜 3. WHAT STILL REMAINS (ship phase)

- **Push to GitHub → Vercel deploy → live page-by-page verification** (Neon already migrated; needs fresh PAT)
- Optional: redo endpoint (spec 30a only defined `/undo`)
- Prior backlog: public-profile header privacy gap (outside tree module)

---

## 🧪 Runtime test highlights (Steps 38–44 turn)

- **Edge suite 13/13 PASS** (empty tree, 5-gen chain, cycle→400, 3rd parent→400, self-marriage→400, divorce PUT ✓, delete-last-member ✓, empty-tree exports ×4, empty/wrong-ext import→400, self-merge→400, relationship type/remove ✓, undo-with-no-versions→proper response, undo-after-delete restores member).
- **Browser polish suite — all green:** main toolbar, node-click sidebar + verify action (badge 1 ✓), sibling reorder dialog + arrow move + save → API order K2,K1,K3 ✓, marriage manager + edit modal (شادی میں ترمیم) ✓, relationship manager ✓, gen-depth select options ✓, dark mode bg rgb(11,18,32) ✓, mobile bottom sheet (390px) ✓ — zero console/page errors.
- **Full-page regression (tree-all-pages):** MAIN 14 nodes + toolbar, STATS modal (charts), SETTINGS, COLLABORATE, HISTORY, INVITE-PAGE (قبول ہو چکی ہے) — all true, zero errors.
- **Bugs found & fixed this turn:** undo 500 on missing snapshot; restoreSnapshot robustness (member upsert + dangling refs); tree-viewer fit (svg viewBox now tracks wrapper → nodes no longer clipped bottom/right); reorder button moved to siblings section; reorder arrows boundary-disabled; mobile toolbar overflow.
- Prior: relationship calc (بیوی/امی والدہ/چھوٹا بھائی), compare 40%, duplicates 95/70/70, merge 8/8/3, export 4 formats, GEDCOM+CSV import, invite→VIEWER→403, privacy, stats, undo IMPORT.
