"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Network, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TreeCard } from "@/components/tree/tree-card";
import type { TreeDto } from "@/types/tree";

interface TreeListItem extends TreeDto {
  owner?: { name: string | null } | null;
}

export default function TreeListPage() {
  const [trees, setTrees] = useState<TreeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "درخت لوڈ نہیں ہو سکے");
      }
      const j = await res.json();
      setTrees(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tree/${deleteTarget.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ڈیلیٹ نہیں ہو سکا");
      toast.success(j?.message || "درخت ڈیلیٹ ہو گیا");
      setTrees((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Family Tree"
        titleUrdu="شجرہ نسب"
        description="اپنے خاندان کا شجرہ بنائیں، ممبرز جوڑیں اور رشتے دیکھیں"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/tree/create">
              <Plus className="mr-1 h-4 w-4" />
              نیا شجرہ
            </Link>
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="شجرہ تلاش کریں..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="outline" className="mt-3" onClick={load}>
            دوبارہ کوشش کریں
          </Button>
        </div>
      ) : trees.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Network className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-base font-medium text-gray-700">Koi data nahi mila</p>
          <p className="mt-1 text-sm text-gray-500">
            {q ? "اس نام سے کوئی شجرہ نہیں ملا" : "آپ نے ابھی کوئی شجرہ نہیں بنایا"}
          </p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/tree/create">
              <Plus className="mr-1 h-4 w-4" />
              پہلا شجرہ بنائیں
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((t) => (
            <TreeCard
              key={t.id}
              tree={t}
              ownerName={t.owner?.name ?? null}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
              deleting={deleting && deleteTarget?.id === t.id}
            />
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>شجرہ ڈیلیٹ کریں؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name}» اور اس کے تمام ممبرز، رشتے اور تصاویر مستقل طور پر ڈیلیٹ ہو جائیں گے۔ یہ
              عمل واپس نہیں ہو سکتا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              جی ہاں، ڈیلیٹ کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
