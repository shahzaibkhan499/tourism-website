import { prisma } from "@/lib/db";

// ============================================================
// ROUND 12 — Bulk event invitations (Fix 1).
//
// Resolves the user accounts to invite for a whole group in
// one click:
//   FAMILY    — every User account linked (FamilyMember.userId)
//               to a member node in any of the creator's Family
//               Trees (trees they created OR are a member of).
//   CLAN      — every User in the creator's Clan.
//   COMMUNITY — every User in any Clan of the creator's Community.
// The creator themselves is never included.
// ============================================================

export const INVITE_AUDIENCES = ["SPECIFIC", "FAMILY", "CLAN", "COMMUNITY"] as const;
export type InviteAudience = (typeof INVITE_AUDIENCES)[number];

export async function resolveAudienceUsers(
  creatorId: string,
  audience: InviteAudience
): Promise<string[]> {
  if (audience === "FAMILY") {
    const trees = await prisma.familyTree.findMany({
      where: {
        OR: [{ creatorId }, { members: { some: { userId: creatorId } } }],
      },
      select: { id: true },
    });
    if (trees.length === 0) return [];
    const members = await prisma.familyMember.findMany({
      where: {
        treeId: { in: trees.map((t) => t.id) },
        userId: { not: creatorId },
      },
      select: { userId: true },
    });
    return Array.from(new Set(members.map((m) => m.userId as string)));
  }

  if (audience === "CLAN") {
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { clanId: true },
    });
    if (!creator?.clanId) return [];
    const users = await prisma.user.findMany({
      where: { clanId: creator.clanId, id: { not: creatorId } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  if (audience === "COMMUNITY") {
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { clan: { select: { communityId: true } } },
    });
    if (!creator?.clan?.communityId) return [];
    const clans = await prisma.clan.findMany({
      where: { communityId: creator.clan.communityId },
      select: { id: true },
    });
    if (clans.length === 0) return [];
    const users = await prisma.user.findMany({
      where: { clanId: { in: clans.map((c) => c.id) }, id: { not: creatorId } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  return [];
}
