import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VersionHistory } from "@/components/tree/version-history";

// ============================================================
// TREE HISTORY PAGE — change history + undo (Step 37).
// ============================================================

interface Props {
  params: { treeId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { name: true },
  });
  if (!tree) return { title: "History — تاریخچہ" };
  return { title: `${tree.name} — History | Digital Family Tree` };
}

export default async function TreeHistoryPage({ params }: Props) {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { id: true, name: true, description: true },
  });
  if (!tree) notFound();

  return (
    <div>
      <PageHeader
        title={`${tree.name} — Change History`}
        titleUrdu="تبدیلیوں کا تاریخچہ"
        description="ہر تبدیلی کا ریکارڈ — کسی بھی قدم پر واپس جائیں (Undo)"
        actions={
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/tree/${tree.id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              واپس — شجرے پر
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <VersionHistory treeId={tree.id} />
      </div>
    </div>
  );
}
