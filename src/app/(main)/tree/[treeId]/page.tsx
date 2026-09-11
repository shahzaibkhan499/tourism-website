import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TreePageClient } from "@/components/tree/tree-page-client";

// ============================================================
// TREE DETAIL PAGE — server wrapper (metadata + not-found),
// client component handles viewer + modals.
// ============================================================

interface Props {
  params: { treeId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const tree = await prisma.familyTree.findUnique({
      where: { id: params.treeId },
      select: { name: true, description: true },
    });
    if (!tree) return { title: "Family Tree — شجرہ نسب" };
    return {
      title: `${tree.name} — Family Tree | Digital Family Tree`,
      description: tree.description ?? "خاندان کا شجرہ نسب — ممبرز، رشتے اور نسلیں",
    };
  } catch {
    return { title: "Family Tree — شجرہ نسب" };
  }
}

export default async function TreeDetailPage({ params }: Props) {
  const tree = await prisma.familyTree.findUnique({
    where: { id: params.treeId },
    select: { id: true },
  });
  if (!tree) notFound();
  return <TreePageClient treeId={tree.id} />;
}
