"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// VERIFY SECTION — Step 23a: verification badges. Shows the
// verify/dispute state for a member and lets editors confirm
// or dispute (note required for disputes).
// ============================================================

interface VerifySectionProps {
  treeId: string;
  memberId: string;
  canEdit: boolean;
}

interface VerifyDto {
  id: string;
  relationshipId: string | null;
  marriageId: string | null;
  memberId: string | null;
  verified: boolean;
  note: string | null;
  createdAt: string;
}

export function VerifySection({ treeId, memberId, canEdit }: VerifySectionProps) {
  const [items, setItems] = useState<VerifyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"verify" | "dispute" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/verify`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "تصدیقات لوڈ نہیں ہوئیں");
      setItems(j.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    load();
  }, [load, memberId]);

  const mine = items.filter((v) => v.memberId === memberId);
  const verifiedCount = mine.filter((v) => v.verified).length;
  const disputedCount = mine.length - verifiedCount;

  const act = async (verified: boolean) => {
    setBusy(verified ? "verify" : "dispute");
    try {
      const res = await fetch(`/api/tree/${treeId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          verified,
          note: verified ? "پروفائل کی تصدیق" : "پروفائل پر اعتراض",
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "کارروائی نہیں ہوئی");
      toast.success(j?.message || (verified ? "تصدیق ہو گئی" : "اعتراض درج ہوا"));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Skeleton className="h-16 w-full" />;

  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BadgeCheck className={`h-4 w-4 ${verifiedCount > 0 ? "text-emerald-600" : "text-gray-400"}`} />
          <span className="text-xs font-semibold text-gray-700">
            تصدیق: {verifiedCount} ✓
            {disputedCount > 0 && <span className="ml-1 text-amber-600">اعتراض: {disputedCount} ⚠</span>}
            {verifiedCount === 0 && disputedCount === 0 && " ابھی تک نہیں ہوئی"}
          </span>
        </div>
        {canEdit && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy !== null} onClick={() => act(true)}>
              {busy === "verify" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <BadgeCheck className="mr-1 h-3 w-3 text-emerald-600" />}
              تصدیق کریں
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy !== null} onClick={() => act(false)}>
              {busy === "dispute" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldAlert className="mr-1 h-3 w-3 text-amber-600" />}
              اعتراض کریں
            </Button>
          </div>
        )}
      </div>
      {mine.length > 0 && (
        <p className="mt-1.5 text-[11px] text-gray-400">
          آخری: {new Date(mine[0].createdAt).toLocaleDateString("en-GB")} · {mine[0].note ?? ""}
        </p>
      )}
    </div>
  );
}
