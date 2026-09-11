"use client";

import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteModal } from "@/components/tree/invite-modal";

// ============================================================
// INVITE LIST — sent invites with status + send new invite.
// ============================================================

interface InviteListProps {
  treeId: string;
}

interface InviteDto {
  id: string;
  inviteeEmail: string | null;
  inviteePhone: string | null;
  inviteeName: string | null;
  type: "VIEW" | "COLLABORATE" | "MERGE" | "CLAIM_PROFILE";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  token: string;
  expiresAt: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "زیر التوا", cls: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "قبول", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "مسترد", cls: "bg-red-100 text-red-700" },
  EXPIRED: { label: "میعاد ختم", cls: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "منسوخ", cls: "bg-gray-100 text-gray-600" },
};

const TYPE_LABELS: Record<string, string> = {
  VIEW: "دیکھنا",
  COLLABORATE: "ساتھ بنانا",
  MERGE: "انضمام",
  CLAIM_PROFILE: "پروفائل کا دعویٰ",
};

export function InviteList({ treeId }: InviteListProps) {
  const [items, setItems] = useState<InviteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/invite`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "دعوتیں لوڈ نہیں ہوئیں");
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="h-8 bg-emerald-600" onClick={() => setOpen(true)}>
          <Send className="mr-1 h-3.5 w-3.5" />
          نئی دعوت بھیجیں
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <p className="py-4 text-center text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila — ابھی کوئی دعوت نہیں بھیجی</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {i.inviteeName ?? i.inviteeEmail ?? i.inviteePhone ?? "نامعلوم"}
                </p>
                <p className="text-xs text-gray-400">
                  {TYPE_LABELS[i.type]} · میعاد:{" "}
                  {new Date(i.expiresAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[i.status]?.cls ?? ""}`}>
                {STATUS_LABELS[i.status]?.label ?? i.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <InviteModal open={open} onOpenChange={(v) => { setOpen(v); if (!v) load(); }} treeId={treeId} />
    </div>
  );
}
