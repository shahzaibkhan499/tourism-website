import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InviteAcceptClient } from "@/components/tree/invite-accept-client";

// ============================================================
// INVITE ACCEPT PAGE — public token page: view invite details,
// accept (adds collaborator / claims profile) or reject.
// ============================================================

interface Props {
  params: { token: string };
}

export const metadata: Metadata = {
  title: "Tree Invite — دعوت | Digital Family Tree",
};

export default async function InviteAcceptPage({ params }: Props) {
  const invite = await prisma.treeInvite.findUnique({
    where: { token: params.token },
    include: {
      tree: { select: { id: true, name: true, description: true } },
    },
  });
  if (!invite) notFound();

  const memberName = invite.memberId
    ? await prisma.familyMember.findUnique({
        where: { id: invite.memberId },
        select: { firstName: true, lastName: true },
      })
    : null;

  return (
    <InviteAcceptClient
      treeId={invite.treeId}
      token={invite.token}
      type={invite.type}
      status={invite.status}
      treeName={invite.tree.name}
      treeDescription={invite.tree.description}
      inviteeName={invite.inviteeName}
      inviteeEmail={invite.inviteeEmail}
      memberName={memberName ? `${memberName.firstName} ${memberName.lastName}`.trim() : null}
      message={invite.message}
      expiresAt={invite.expiresAt.toISOString()}
    />
  );
}
