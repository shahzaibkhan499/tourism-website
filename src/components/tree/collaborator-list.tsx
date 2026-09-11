"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// ============================================================
// COLLABORATOR LIST — roles VIEWER/EDITOR/ADMIN, add by email,
// change role, remove. OWNER is the creator (not editable).
// ============================================================

interface CollaboratorDto {
  id: string;
  userId: string;
  role: "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";
  canEditBranch: string | null;
  addedAt: string;
  user: { id: string; name: string | null; email: string; image: string | null } | null;
}

interface CollaboratorListProps {
  treeId: string;
}

const ROLE_LABELS: Record<string, string> = {
  VIEWER: "VIEWER — صرف دیکھ سکتا ہے",
  EDITOR: "EDITOR — ممبرز بنا سکتا ہے",
  ADMIN: "ADMIN — ساتھی بنا سکتا ہے",
  OWNER: "OWNER — مالک",
};

export function CollaboratorList({ treeId }: CollaboratorListProps) {
  const [items, setItems] = useState<CollaboratorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR" | "ADMIN">("VIEWER");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<CollaboratorDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/collaborate`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ساتھی لوڈ نہیں ہوئے");
      setItems(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!email.trim()) {
      toast.error("ای میل لکھیں");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/collaborate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ساتھی نہیں بنا سکا");
      toast.success(j?.message || "ساتھی شامل ہو گیا");
      setEmail("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setAdding(false);
    }
  };

  const changeRole = async (c: CollaboratorDto, newRole: string) => {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/tree/${treeId}/collaborate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId: c.id, role: newRole }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "رول نہیں بدلا");
      toast.success(j?.message || "رول بدل دیا گیا");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      const res = await fetch(`/api/tree/${treeId}/collaborate`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaboratorId: removing.id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "نہیں ہٹا سکے");
      toast.success(j?.message || "ساتھی ہٹا دیا گیا");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-gray-50 p-3">
        <Label className="mb-1.5 block text-xs">نئے ساتھی کی ای میل</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            placeholder="example@email.com"
            className="h-9 bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select value={role} onValueChange={(v) => setRole(v as "VIEWER" | "EDITOR" | "ADMIN")}>
            <SelectTrigger className="h-9 w-full bg-white sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIEWER">VIEWER — ناظر</SelectItem>
              <SelectItem value="EDITOR">EDITOR — ایڈیٹر</SelectItem>
              <SelectItem value="ADMIN">ADMIN — منتظم</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-9 bg-emerald-600 hover:bg-emerald-700" disabled={adding} onClick={add}>
            {adding ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
            شامل کریں
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <p className="py-4 text-center text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila — ابھی کوئی ساتھی نہیں</p>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{c.user?.name ?? c.user?.email ?? "صارف"}</p>
                <p className="truncate text-xs text-gray-400">{c.user?.email}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Select
                  value={c.role}
                  onValueChange={(v) => changeRole(c, v)}
                  disabled={c.role === "OWNER" || busyId === c.id}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">VIEWER</SelectItem>
                    <SelectItem value="EDITOR">EDITOR</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:bg-red-50"
                  onClick={() => setRemoving(c)}
                  disabled={c.role === "OWNER"}
                  aria-label="Remove collaborator"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">{Object.entries(ROLE_LABELS).map(([k, v]) => `${k}=${v}`).join(" · ")}</p>

      <AlertDialog open={Boolean(removing)} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ساتھی ہٹا دیں؟</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.user?.name ?? removing?.user?.email ?? ""} اب اس درخت کو نہیں دیکھ سکے گا۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={(e) => { e.preventDefault(); confirmRemove(); }}>
              جی ہاں، ہٹا دیں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
