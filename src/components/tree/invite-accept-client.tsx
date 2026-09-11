"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, TreePine, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

// ============================================================
// INVITE ACCEPT CLIENT — accept/reject actions for invite page.
// ============================================================

interface InviteAcceptClientProps {
  treeId: string;
  token: string;
  type: "VIEW" | "COLLABORATE" | "MERGE" | "CLAIM_PROFILE";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  treeName: string;
  treeDescription: string | null;
  inviteeName: string | null;
  inviteeEmail: string | null;
  memberName: string | null;
  message: string | null;
  expiresAt: string;
}

const TYPE_URDU: Record<InviteAcceptClientProps["type"], string> = {
  VIEW: "درخت دیکھنے کی دعوت",
  COLLABORATE: "مل کر درخت بنانے کی دعوت",
  MERGE: "درخت کے انضمام کی دعوت",
  CLAIM_PROFILE: "پروفائل کے دعوے کی دعوت",
};

export function InviteAcceptClient(props: InviteAcceptClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [done, setDone] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const expired = new Date(props.expiresAt) < new Date();
  const completed = props.status !== "PENDING" || done !== null;

  const respond = async (accept: boolean) => {
    setBusy(accept ? "accept" : "reject");
    try {
      const res = await fetch(`/api/tree/${props.treeId}/invite/${props.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "کارروائی نہیں ہوئی");
      setDone(accept ? "ACCEPTED" : "REJECTED");
      toast.success(j?.message ?? (accept ? "دعوت قبول ہو گئی" : "دعوت مسترد ہو گئی"));
      if (accept) {
        setTimeout(() => router.push(`/tree/${props.treeId}`), 1200);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Family Tree Invite" titleUrdu="شجرے کی دعوت" />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <TreePine className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{props.treeName}</h2>
            {props.treeDescription && <p className="text-sm text-gray-500">{props.treeDescription}</p>}
          </div>
        </div>

        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {TYPE_URDU[props.type]}
        </p>

        <dl className="mt-3 space-y-1.5 text-sm text-gray-600">
          {props.inviteeName && (
            <div className="flex justify-between">
              <dt className="text-gray-400">نام</dt>
              <dd>{props.inviteeName}</dd>
            </div>
          )}
          {props.inviteeEmail && (
            <div className="flex justify-between">
              <dt className="text-gray-400">ای میل</dt>
              <dd>{props.inviteeEmail}</dd>
            </div>
          )}
          {props.memberName && (
            <div className="flex justify-between">
              <dt className="text-gray-400">ممبر</dt>
              <dd>{props.memberName}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-400">میعاد</dt>
            <dd>{new Date(props.expiresAt).toLocaleDateString("en-GB")}</dd>
          </div>
        </dl>

        {props.message && (
          <p className="mt-3 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600">
            «{props.message}»
          </p>
        )}

        {done === "ACCEPTED" || props.status === "ACCEPTED" ? (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-1 text-sm font-semibold text-emerald-800">دعوت قبول ہو چکی ہے ✓</p>
            <p className="text-xs text-emerald-600">درخت پر لے جایا جا رہا ہے...</p>
          </div>
        ) : done === "REJECTED" || props.status === "REJECTED" ? (
          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">
            <X className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-1 text-sm text-gray-600">دعوت مسترد کر دی گئی</p>
          </div>
        ) : expired || props.status === "EXPIRED" ? (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 text-center">
            <p className="text-sm font-semibold text-amber-800">یہ دعوت ختم ہو چکی ہے</p>
            <p className="text-xs text-amber-600">دوبارہ دعوت بھیجنے کو کہیں</p>
          </div>
        ) : props.status === "CANCELLED" ? (
          <div className="mt-5 rounded-xl bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600">یہ دعوت منسوخ کر دی گئی ہے</p>
          </div>
        ) : (
          <div className="mt-5 flex gap-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={busy !== null}
              onClick={() => respond(true)}
            >
              {busy === "accept" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              قبول کریں
            </Button>
            <Button variant="outline" className="flex-1" disabled={busy !== null} onClick={() => respond(false)}>
              {busy === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              مسترد کریں
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
