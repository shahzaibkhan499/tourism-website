import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getIp } from "@/lib/api";
import type { FamilyMember, FamilyTree, Prisma, TreePrivacySettings, User } from "@prisma/client";

// ============================================================
// FAMILY TREE — access control + privacy enforcement
// RULE 8: owner checks on every write, collaborator role checks,
// privacy enforced on every data fetch.
// ============================================================

export type TreeRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | "REGISTERED_VIEWER" | "ANONYMOUS";

export type CurrentTreeUser = Awaited<ReturnType<typeof getCurrentUser>>;

export interface TreeAccess {
  user: CurrentTreeUser;
  tree: FamilyTree;
  role: TreeRole;
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageRoles: boolean;
  privacy: TreePrivacySettings | null;
}

const EDIT_ROLES: TreeRole[] = ["OWNER", "ADMIN", "EDITOR"];
const DELETE_ROLES: TreeRole[] = ["OWNER"];
const INVITE_ROLES: TreeRole[] = ["OWNER", "ADMIN", "EDITOR"];
const MANAGE_ROLES: TreeRole[] = ["OWNER", "ADMIN"];

export async function resolveTreeAccess(
  treeId: string,
  req: Request,
  opts: { allowPublic?: boolean } = { allowPublic: true }
): Promise<{ access: TreeAccess } | { status: number; message: string }> {
  const user = await getCurrentUser();
  const tree = await prisma.familyTree.findUnique({
    where: { id: treeId },
    include: { privacy: true },
  });
  if (!tree) return { status: 404, message: "درخت نہیں ملا" };

  let role: TreeRole;
  if (user && tree.creatorId === user.id) {
    role = "OWNER";
  } else if (user) {
    const collab = await prisma.treeCollaborator.findUnique({
      where: { treeId_userId: { treeId: tree.id, userId: user.id } },
    });
    if (collab) {
      role = collab.role === "OWNER" ? "ADMIN" : collab.role; // OWNER role reserved for creator
    } else if (tree.visibility === "CLAN_ONLY") {
      const creator = await prisma.user.findUnique({
        where: { id: tree.creatorId },
        select: { clanId: true },
      });
      if (!(creator?.clanId && user.clanId === creator.clanId)) {
        return { status: 403, message: "یہ درخت صرف کلان کے لوگوں کے لیے ہے" };
      }
      role = "REGISTERED_VIEWER";
    } else if (tree.visibility === "REGISTERED") {
      role = "REGISTERED_VIEWER";
    } else {
      // PRIVATE / COLLABORATORS and user is neither owner nor collaborator
      return { status: 403, message: "اس درخت کو دیکھنے کی اجازت نہیں ہے" };
    }
  } else {
    // Anonymous
    if (!opts.allowPublic || (tree.visibility !== "PUBLIC" && !tree.isPublic)) {
      return { status: 401, message: "لاگ اِن کرنا ضروری ہے" };
    }
    role = "ANONYMOUS";
  }

  const access: TreeAccess = {
    user,
    tree,
    role,
    canEdit: EDIT_ROLES.includes(role),
    canDelete: DELETE_ROLES.includes(role),
    canInvite: INVITE_ROLES.includes(role),
    canManageRoles: MANAGE_ROLES.includes(role),
    privacy: tree.privacy,
  };
  return { access };
}

/** Require edit access — throws HTTP-ish responses via return contract */
export function assertCanEdit(access: TreeAccess): { status: number; message: string } | null {
  return access.canEdit ? null : { status: 403, message: "آپ کو اس درخت میں تبدیلی کی اجازت نہیں ہے" };
}

export function assertCanDelete(access: TreeAccess): { status: number; message: string } | null {
  return access.canDelete ? null : { status: 403, message: "صرف مالک ہی درخت ڈیلیٹ کر سکتا ہے" };
}

/**
 * Apply tree-level + member-level privacy to a member list.
 * Editors/owners always see everything.
 */
export function applyPrivacyToMembers(
  members: (FamilyMember & { memberPrivacy?: { isHidden: boolean; hidePhoto: boolean; hideDates: boolean; hideBio: boolean; hideContact: boolean } | null })[],
  access: TreeAccess
): FamilyMember[] {
  if (access.canEdit) return members;
  const p = access.privacy;
  return members
    .filter((m) => {
      if (m.memberPrivacy?.isHidden) return false;
      if (p && !p.showFemales && m.gender === "FEMALE") return false;
      if (p && !p.showLiving && m.isAlive) return false;
      if (!m.showInPublic && access.role !== "OWNER") return false;
      return true;
    })
    .map((m) => {
      const clone = { ...m };
      const mp = m.memberPrivacy;
      if ((p && !p.showPhotos) || mp?.hidePhoto) clone.photo = null;
      if ((p && !p.showDates) || mp?.hideDates) {
        clone.dateOfBirth = null;
        clone.dateOfDeath = null;
      }
      if ((p && !p.showBio) || mp?.hideBio) clone.bio = null;
      if ((p && !p.showPlaces)) {
        clone.birthPlace = null;
        clone.deathPlace = null;
        clone.currentCity = null;
      }
      if ((p && !p.showOccupation)) clone.occupation = null;
      if ((p && !p.showContact) || mp?.hideContact) {
        clone.phone = null;
        clone.email = null;
      }
      clone.memberPrivacy = undefined;
      return clone;
    });
}

/** Log tree access (fire-and-forget, never blocks the request) */
export async function logTreeAccess(treeId: string, userId: string | null, action: string, req: Request) {
  try {
    await prisma.treeAccessLog.create({
      data: {
        treeId,
        userId,
        action,
        ipAddress: getIp(req.headers),
        userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
      },
    });
  } catch (error) {
    console.error("[TREE ACCESS LOG FAILED]", error);
  }
}

/** Snapshot the current graph for versioning (Steps 30a/30b) */
export async function snapshotTree(treeId: string): Promise<Prisma.InputJsonValue> {
  const [members, relationships, marriages] = await Promise.all([
    prisma.familyMember.findMany({ where: { treeId }, orderBy: { createdAt: "asc" } }),
    prisma.relationship.findMany({ where: { treeId } }),
    prisma.marriage.findMany({ where: { treeId } }),
  ]);
  return {
    members: members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender,
      dateOfBirth: m.dateOfBirth?.toISOString() ?? null,
      dateOfDeath: m.dateOfDeath?.toISOString() ?? null,
      isAlive: m.isAlive,
      generation: m.generation,
      sortOrder: m.sortOrder,
      parentIds: relationships.filter((r) => r.childId === m.id).map((r) => r.parentId),
    })),
    marriages: marriages.map((m) => ({
      id: m.id,
      spouse1Id: m.spouse1Id,
      spouse2Id: m.spouse2Id,
      status: m.status,
      date: m.date?.toISOString() ?? null,
    })),
  } as unknown as Prisma.InputJsonValue;
}

/** Restore a snapshot (used by undo) */
export async function restoreSnapshot(treeId: string, snapshot: unknown) {
  const snap = snapshot as {
    members: { id: string; firstName: string; lastName: string; gender: string; dateOfBirth: string | null; dateOfDeath: string | null; isAlive: boolean; generation: number; sortOrder: number; parentIds: string[] }[];
    marriages: { id: string; spouse1Id: string; spouse2Id: string; status: string; date: string | null }[];
  };
  await prisma.$transaction([
    prisma.relationship.deleteMany({ where: { treeId } }),
    prisma.marriage.deleteMany({ where: { treeId } }),
    ...snap.members.map((m) =>
      prisma.familyMember.update({
        where: { id: m.id },
        data: {
          firstName: m.firstName,
          lastName: m.lastName,
          gender: m.gender as never,
          dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
          dateOfDeath: m.dateOfDeath ? new Date(m.dateOfDeath) : null,
          isAlive: m.isAlive,
          generation: m.generation,
          sortOrder: m.sortOrder,
        },
      })
    ),
    ...snap.members.flatMap((m) =>
      m.parentIds.map((pid) =>
        prisma.relationship.create({
          data: { treeId, parentId: pid, childId: m.id },
        })
      )
    ),
    ...snap.marriages.map((m) =>
      prisma.marriage.create({
        data: {
          id: m.id,
          treeId,
          spouse1Id: m.spouse1Id,
          spouse2Id: m.spouse2Id,
          status: m.status as never,
          date: m.date ? new Date(m.date) : null,
        },
      })
    ),
  ]);
}

/** Record a version entry (called after every mutation) */
export async function recordVersion(
  treeId: string,
  userId: string,
  action: string,
  before: Prisma.InputJsonValue,
  changes: Record<string, unknown>
) {
  await prisma.treeVersion.create({
    data: {
      treeId,
      userId,
      action,
      snapshot: before,
      changes: changes as Prisma.InputJsonValue,
    },
  });
}

/** Update memberCount / generationCount / lastModified after mutations */
export async function refreshTreeStats(treeId: string) {
  const [members, generations] = await Promise.all([
    prisma.familyMember.findMany({ where: { treeId }, select: { generation: true } }),
    prisma.familyMember.aggregate({ where: { treeId }, _max: { generation: true } }),
  ]);
  await prisma.familyTree.update({
    where: { id: treeId },
    data: {
      memberCount: members.length,
      generationCount: generations._max.generation ?? 1,
      lastModified: new Date(),
    },
  });
}
