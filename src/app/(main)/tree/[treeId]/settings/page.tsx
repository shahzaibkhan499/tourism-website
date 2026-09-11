import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrivacySettings } from "@/components/tree/privacy-settings";
import { GroupPhotos } from "@/components/tree/group-photos";

// ============================================================
// TREE SETTINGS PAGE — privacy (tree + member level) and
// family group photos with face tagging.
// ============================================================

interface Props {
  params: { treeId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { name: true },
  });
  if (!tree) return { title: "Tree Settings — ترتیبات" };
  return { title: `${tree.name} — Settings | Digital Family Tree` };
}

export default async function TreeSettingsPage({ params }: Props) {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { id: true, name: true, description: true },
  });
  if (!tree) notFound();

  const members = await prisma.familyMember.findMany({
    where: { treeId: params.treeId },
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div>
      <PageHeader
        title={`${tree.name} — Settings`}
        titleUrdu="ترتیبات"
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

      <Tabs defaultValue="privacy">
        <TabsList className="mb-4">
          <TabsTrigger value="privacy">رازداری — Privacy</TabsTrigger>
          <TabsTrigger value="photos">خاندانی تصاویر — Group Photos</TabsTrigger>
        </TabsList>
        <TabsContent value="privacy">
          <PrivacySettings treeId={tree.id} />
        </TabsContent>
        <TabsContent value="photos">
          <GroupPhotos
            treeId={tree.id}
            memberIds={members.map((m) => ({
              id: m.id,
              label: `${m.firstName} ${m.lastName}`.trim(),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
