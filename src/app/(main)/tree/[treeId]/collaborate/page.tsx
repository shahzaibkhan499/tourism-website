import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollaboratorList } from "@/components/tree/collaborator-list";
import { InviteList } from "@/components/tree/invite-list";

// ============================================================
// TREE COLLABORATE PAGE — collaborators (roles) + invites.
// ============================================================

interface Props {
  params: { treeId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { name: true },
  });
  if (!tree) return { title: "Collaborate — ساتھی" };
  return { title: `${tree.name} — Collaborate | Digital Family Tree` };
}

export default async function TreeCollaboratePage({ params }: Props) {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { id: true, name: true, description: true },
  });
  if (!tree) notFound();

  return (
    <div>
      <PageHeader
        title={`${tree.name} — Collaborate`}
        titleUrdu="ساتھی اور دعوتیں"
        description={tree.description ?? undefined}
        actions={
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/tree/${tree.id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              واپس — شجرے پر
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="collaborators">
        <TabsList className="mb-4">
          <TabsTrigger value="collaborators">ساتھی — Collaborators</TabsTrigger>
          <TabsTrigger value="invites">دعوتیں — Invites</TabsTrigger>
        </TabsList>
        <TabsContent value="collaborators">
          <CollaboratorList treeId={tree.id} />
        </TabsContent>
        <TabsContent value="invites">
          <InviteList treeId={tree.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
