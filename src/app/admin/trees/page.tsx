"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Trash2, Loader2, Eye, TreePine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ============================================================
// /admin/trees — platform-wide family tree management (real DB).
// Every admin page is a MANAGEMENT screen; the admin's own tree
// lives under /tree/[...] like every other user's.
// ============================================================

interface AdminTree {
  id: string;
  name: string;
  visibility: string;
  isPublic: boolean;
  memberCount: number;
  generationCount: number;
  createdAt: string;
  creator: { id: string; email: string; name: string | null };
}

export default function AdminTreesPage() {
  const [trees, setTrees] = useState<AdminTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trees?limit=100${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      const j = await res.json().catch(() => null);
      setTrees(j?.items ?? []);
      setTotal(j?.total ?? 0);
    } catch {
      toast.error("Failed to load — لوڈ نہیں ہوا");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/trees?ids=${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? "failed");
      toast.success(j?.message ?? "درخت حذف ہو گیا");
      setTrees((prev) => prev.filter((t) => t.id !== id));
      setTotal((n) => Math.max(0, n - 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حذف نہیں ہوا");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Family Trees — خاندانی شجرے
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} trees on the platform — پلیٹ فارم پر کل شجرے
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search trees / owner email — تلاش کریں"
            className="w-72 pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : trees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-500 dark:text-gray-400">
              <TreePine className="h-10 w-10" />
              <p className="text-sm">No trees found — کوئی شجرہ نہیں ملا</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tree — شجرہ</TableHead>
                  <TableHead>Owner — مالک</TableHead>
                  <TableHead>Members — ممبرز</TableHead>
                  <TableHead>Generations — نسلیں</TableHead>
                  <TableHead>Visibility — نمائش</TableHead>
                  <TableHead className="text-right">Actions — اعمال</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trees.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-[280px]">
                      <span className="line-clamp-1 font-medium text-gray-900 dark:text-gray-100">
                        {t.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(t.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                      {t.creator.name ?? t.creator.email}
                      <span className="block text-xs text-gray-400">{t.creator.email}</span>
                    </TableCell>
                    <TableCell>{t.memberCount}</TableCell>
                    <TableCell>{t.generationCount}</TableCell>
                    <TableCell>
                      <Badge variant={t.isPublic ? "default" : "outline"}>
                        {t.visibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/tree/${t.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          disabled={deleting === t.id}
                          onClick={() => onDelete(t.id)}
                        >
                          {deleting === t.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
