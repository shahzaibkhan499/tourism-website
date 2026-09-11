import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { assertCanEdit, logTreeAccess, recordVersion, refreshTreeStats, resolveTreeAccess, snapshotTree } from "@/lib/tree-access";
import { parseGedcom } from "@/lib/gedcom-parser";
import { parseCsv, parseFlexibleDate, guessGender, guessIsAlive } from "@/lib/csv-parser";
import { scoreMatch } from "@/lib/duplicate-detection";
import type { MatchMemberRow } from "@/lib/duplicate-detection";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// POST /api/tree/import — multipart upload (GEDCOM or CSV) with mapping
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData().catch(() => null);
    if (!form) return apiError(400, "غلط درخواست — فائل اپ لوڈ کریں");

    const treeId = String(form.get("treeId") ?? "");
    const format = String(form.get("format") ?? "gedcom");
    const mappingRaw = String(form.get("mapping") ?? "{}");
    const file = form.get("file");
    if (!treeId) return apiError(400, "درخت منتخب کریں");
    if (!file || !(file instanceof File)) return apiError(400, "فائل منتخب کریں");
    if (!["gedcom", "csv"].includes(format)) return apiError(400, "صرف GEDCOM یا CSV فائل سپورٹ ہے");

    // R8: file validation (type + size)
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (format === "gedcom" && !["ged", "gedcom", "txt"].includes(ext)) {
      return apiError(400, "GEDCOM فائل .ged ہونی چاہیے");
    }
    if (format === "csv" && !["csv", "txt"].includes(ext)) {
      return apiError(400, "CSV فائل .csv ہونی چاہیے");
    }
    if (file.size > MAX_FILE_SIZE) return apiError(400, "فائل 2MB سے بڑی نہیں ہو سکتی");
    if (file.size === 0) return apiError(400, "فائل خالی ہے");

    const resolved = await resolveTreeAccess(treeId, req);
    if ("status" in resolved) return apiError(resolved.status, resolved.message);
    const { access } = resolved;
    const denied = assertCanEdit(access);
    if (denied) return apiError(denied.status, denied.message);

    const content = await file.text();
    const before = await snapshotTree(treeId);

    // existing members for duplicate detection + name matching
    const existing = await prisma.familyMember.findMany({
      where: { treeId },
      include: {
        parentRelations: { select: { parentId: true } },
        spouse1Relations: { select: { spouse2Id: true } },
        spouse2Relations: { select: { spouse1Id: true } },
      },
    });

    const result = { created: 0, skipped: 0, relationships: 0, marriages: 0, warnings: [] as string[] };

    // Parse BEFORE the transaction so user-facing parse errors return 400
    let gedcomParsed = null as ReturnType<typeof parseGedcom> | null;
    let csvParsed = null as ReturnType<typeof parseCsv> | null;
    let effMapping: Record<string, string> = {};
    try {
      if (format === "gedcom") {
        gedcomParsed = parseGedcom(content);
        if (gedcomParsed.individuals.length === 0) {
          return apiError(400, "GEDCOM میں کوئی فرد نہیں ملا");
        }
      } else {
        let mapping: Record<string, string> = {};
        try {
          mapping = JSON.parse(mappingRaw);
        } catch {
          mapping = {};
        }
        csvParsed = parseCsv(content);
        effMapping =
          Object.keys(mapping).length > 0 ? mapping : (csvParsed.autoMap as unknown as Record<string, string>);
        if (Object.keys(effMapping).length === 0) {
          return apiError(400, "کالم میپنگ نہیں ملی — CSV کے کالم نقشے منتخب کریں");
        }
      }
    } catch (e) {
      return apiError(400, e instanceof Error ? e.message : "فائل پڑھی نہیں جا سکی");
    }

    await prisma.$transaction(async (tx) => {
      if (format === "gedcom") {
        const parsed = gedcomParsed!;
        result.warnings.push(...parsed.warnings);

        const xrefMap = new Map<string, string>();
        for (const ind of parsed.individuals) {
          const row: MatchMemberRow = {
            id: ind.xref,
            treeId,
            userId: null,
            firstName: ind.firstName || "نامعلوم",
            lastName: ind.lastName || "",
            nickName: ind.nickName,
            gender: (ind.gender ?? "MALE") as "MALE" | "FEMALE" | "OTHER",
            dateOfBirth: ind.dateOfBirth ? new Date(ind.dateOfBirth) : null,
            dateOfDeath: ind.dateOfDeath ? new Date(ind.dateOfDeath) : null,
            isAlive: ind.dateOfDeath ? false : true,
            photo: null,
            birthPlace: ind.birthPlace,
            deathPlace: ind.deathPlace,
            currentCity: null,
            occupation: ind.occupation,
            education: ind.education,
            bio: ind.note ?? ind.bio,
            phone: null,
            email: null,
            generation: 1,
            sortOrder: 0,
            isPrivate: false,
            showInPublic: true,
            positionX: null,
            positionY: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            parentIds: [],
            spouseIds: [],
          };
          const dup = (existing as MatchMemberRow[]).map((o) => ({
            score: scoreMatch(
              {
                id: row.id,
                firstName: row.firstName,
                lastName: row.lastName,
                dateOfBirth: row.dateOfBirth,
                birthPlace: row.birthPlace,
                currentCity: row.currentCity,
                parentIds: row.parentIds ?? [],
                spouseIds: row.spouseIds ?? [],
              },
              {
                id: o.id,
                firstName: o.firstName,
                lastName: o.lastName,
                dateOfBirth: o.dateOfBirth,
                birthPlace: o.birthPlace,
                currentCity: o.currentCity,
                parentIds: o.parentIds ?? [],
                spouseIds: o.spouseIds ?? [],
              }
            ),
          }));
          if (dup.some((d) => d.score >= 80)) {
            result.skipped += 1;
            result.warnings.push(`${ind.firstName} ${ind.lastName} ممکنہ ڈپلیکیٹ ہونے کی وجہ سے چھوڑا گیا`);
            continue;
          }
          const created = await tx.familyMember.create({
            data: {
              treeId,
              firstName: ind.firstName || "نامعلوم",
              lastName: ind.lastName || "",
              nickName: ind.nickName,
              gender: (ind.gender ?? "MALE") as "MALE" | "FEMALE",
              dateOfBirth: ind.dateOfBirth ? new Date(ind.dateOfBirth) : null,
              dateOfDeath: ind.dateOfDeath ? new Date(ind.dateOfDeath) : null,
              isAlive: ind.dateOfDeath ? false : true,
              photo: null,
              birthPlace: ind.birthPlace,
              deathPlace: ind.deathPlace,
              occupation: ind.occupation,
              education: ind.education,
              bio: ind.note ?? ind.bio,
              generation: 1,
            },
          });
          xrefMap.set(ind.xref, created.id);
          result.created += 1;
        }

        // families: relationships + marriages
        const pairSet = new Set<string>();
        for (const fam of parsed.families) {
          const husbandId = fam.husbandXref ? xrefMap.get(fam.husbandXref) : null;
          const wifeId = fam.wifeXref ? xrefMap.get(fam.wifeXref) : null;
          if (husbandId && wifeId) {
            const key = `${husbandId}|${wifeId}`;
            if (!pairSet.has(key)) {
              pairSet.add(key);
              await tx.marriage.create({
                data: {
                  treeId,
                  spouse1Id: husbandId,
                  spouse2Id: wifeId,
                  date: fam.marriageDate ? new Date(fam.marriageDate) : null,
                  endDate: fam.divorceDate ? new Date(fam.divorceDate) : null,
                  location: fam.marriagePlace,
                  status: fam.status === "DIVORCED" ? "DIVORCED" : "MARRIED",
                  type: "NIKKAH",
                },
              });
              result.marriages += 1;
            }
          }
          for (const childXref of fam.childXrefs) {
            const childId = xrefMap.get(childXref);
            if (!childId) continue;
            for (const parentId of [husbandId, wifeId]) {
              if (!parentId) continue;
              const key = `${parentId}|${childId}`;
              if (pairSet.has(key)) continue;
              pairSet.add(key);
              await tx.relationship.create({
                data: { treeId, parentId, childId, type: "BIOLOGICAL" },
              });
              result.relationships += 1;
            }
          }
        }

        // fix generations via BFS
        const allMembers = await tx.familyMember.findMany({ where: { treeId } });
        const allRels = await tx.relationship.findMany({ where: { treeId } });
        const genMap = new Map<string, number>();
        const parentIdsOf = new Map<string, string[]>();
        for (const r of allRels) {
          parentIdsOf.set(r.childId, [...(parentIdsOf.get(r.childId) ?? []), r.parentId]);
        }
        const compute = (id: string, seen: Set<string>): number => {
          if (genMap.has(id)) return genMap.get(id)!;
          if (seen.has(id)) return 1;
          seen.add(id);
          const parents = parentIdsOf.get(id) ?? [];
          if (parents.length === 0) return 1;
          const g = Math.max(...parents.map((p) => compute(p, seen))) + 1;
          genMap.set(id, g);
          return g;
        };
        for (const m of allMembers) {
          const g = compute(m.id, new Set());
          if (g !== m.generation) {
            await tx.familyMember.update({ where: { id: m.id }, data: { generation: g } });
          }
        }
      } else {
        // CSV import
        const parsed = csvParsed!;
        result.warnings.push(...parsed.warnings);

        const nameToId = new Map<string, string>();
        for (const m of existing) {
          nameToId.set(`${m.firstName} ${m.lastName}`.trim().toLowerCase(), m.id);
          nameToId.set(m.firstName.trim().toLowerCase(), m.id);
        }
        const pendingLinks: { memberId: string; fatherName: string | null; motherName: string | null; spouseName: string | null }[] = [];

        for (const row of parsed.rows) {
          const get = (field: string) => {
            const col = Object.keys(effMapping).find((k) => effMapping[k] === field);
            return col ? row[field as keyof typeof row] ?? null : null;
          };
          const firstName = (get("firstName") ?? "").trim();
          if (!firstName) {
            result.skipped += 1;
            continue;
          }
          const gender = guessGender(get("gender")) ?? "MALE";
          const dob = parseFlexibleDate(get("dateOfBirth"));
          const dod = parseFlexibleDate(get("dateOfDeath"));
          const isAlive = guessIsAlive(get("isAlive")) ?? !dod;

          const dupRow: MatchMemberRow = {
            id: `csv-${Math.random()}`,
            treeId,
            userId: null,
            firstName,
            lastName: (get("lastName") ?? "").trim(),
            nickName: null,
            gender: gender as "MALE" | "FEMALE",
            dateOfBirth: dob ? new Date(dob) : null,
            dateOfDeath: dod ? new Date(dod) : null,
            isAlive,
            photo: null,
            birthPlace: get("birthPlace"),
            deathPlace: get("deathPlace"),
            currentCity: get("currentCity"),
            occupation: get("occupation"),
            education: get("education"),
            bio: get("bio"),
            phone: get("phone"),
            email: get("email"),
            generation: 1,
            sortOrder: 0,
            isPrivate: false,
            showInPublic: true,
            positionX: null,
            positionY: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            parentIds: [],
            spouseIds: [],
          };
          const dup = (existing as MatchMemberRow[]).map((o) => ({
            score: scoreMatch(
              {
                id: dupRow.id,
                firstName: dupRow.firstName,
                lastName: dupRow.lastName,
                dateOfBirth: dupRow.dateOfBirth,
                birthPlace: dupRow.birthPlace,
                currentCity: dupRow.currentCity,
                parentIds: [],
                spouseIds: [],
              },
              {
                id: o.id,
                firstName: o.firstName,
                lastName: o.lastName,
                dateOfBirth: o.dateOfBirth,
                birthPlace: o.birthPlace,
                currentCity: o.currentCity,
                parentIds: o.parentIds ?? [],
                spouseIds: o.spouseIds ?? [],
              }
            ),
          }));
          if (dup.some((d) => d.score >= 80)) {
            result.skipped += 1;
            result.warnings.push(`${firstName} ممکنہ ڈپلیکیٹ ہونے کی وجہ سے چھوڑا گیا`);
            continue;
          }
          const created = await tx.familyMember.create({
            data: {
              treeId,
              firstName,
              lastName: dupRow.lastName,
              gender: gender as "MALE" | "FEMALE",
              dateOfBirth: dob ? new Date(dob) : null,
              dateOfDeath: dod ? new Date(dod) : null,
              isAlive,
              birthPlace: get("birthPlace"),
              deathPlace: get("deathPlace"),
              currentCity: get("currentCity"),
              occupation: get("occupation"),
              education: get("education"),
              bio: get("bio"),
              phone: get("phone"),
              email: get("email"),
              generation: 1,
            },
          });
          nameToId.set(`${created.firstName} ${created.lastName}`.trim().toLowerCase(), created.id);
          nameToId.set(created.firstName.trim().toLowerCase(), created.id);
          pendingLinks.push({
            memberId: created.id,
            fatherName: get("fatherName"),
            motherName: get("motherName"),
            spouseName: get("spouseName"),
          });
          result.created += 1;
        }

        // resolve name-based links
        const relSet = new Set<string>();
        const marSet = new Set<string>();
        for (const link of pendingLinks) {
          for (const [parentName] of [
            [link.fatherName, "parent"],
            [link.motherName, "parent"],
          ] as const) {
            if (!parentName) continue;
            const parentId = nameToId.get(parentName.trim().toLowerCase());
            if (!parentId || parentId === link.memberId) continue;
            const key = `${parentId}|${link.memberId}`;
            if (relSet.has(key)) continue;
            relSet.add(key);
            await tx.relationship.create({
              data: { treeId, parentId, childId: link.memberId, type: "BIOLOGICAL" },
            });
            result.relationships += 1;
          }
          if (link.spouseName) {
            const spouseId = nameToId.get(link.spouseName.trim().toLowerCase());
            if (!spouseId || spouseId === link.memberId) continue;
            const key = `${link.memberId}|${spouseId}`;
            const key2 = `${spouseId}|${link.memberId}`;
            if (marSet.has(key) || marSet.has(key2)) continue;
            marSet.add(key);
            await tx.marriage.create({
              data: { treeId, spouse1Id: link.memberId, spouse2Id: spouseId, status: "MARRIED", type: "NIKKAH" },
            });
            result.marriages += 1;
          }
        }
      }
    });

    await recordVersion(treeId, user.id, "IMPORT", before, {
      format,
      created: result.created,
      skipped: result.skipped,
    });
    await refreshTreeStats(treeId);
    await logTreeAccess(treeId, user.id, "IMPORT", req);

    return apiSuccess(
      {
        message: `امپورٹ مکمل — ${result.created} ممبر شامل ہوئے، ${result.skipped} چھوڑے گئے`,
        created: result.created,
        skipped: result.skipped,
        relationships: result.relationships,
        marriages: result.marriages,
        warnings: result.warnings,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
