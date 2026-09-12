"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================
// INVITE MODAL — send invite (4 types) with copy-link result.
// ============================================================

const formSchema = z.object({
  type: z.enum(["VIEW", "COLLABORATE", "MERGE", "CLAIM_PROFILE"]),
  inviteeEmail: z.string().trim().email("A valid email is required — درست ای میل لکھنا ضروری ہے"),
  inviteeName: z.string().trim().max(200),
  message: z.string().trim().max(1000),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
}

const TYPE_LABELS: Record<FormValues["type"], string> = {
  VIEW: "VIEW — صرف دیکھنے کے لیے",
  COLLABORATE: "COLLABORATE — مل کر بنانے کے لیے",
  MERGE: "MERGE — انضمام کے لیے",
  CLAIM_PROFILE: "CLAIM_PROFILE — پروفائل کا دعویٰ",
};

export function InviteModal({ open, onOpenChange, treeId }: InviteModalProps) {
  const [saving, setSaving] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "VIEW", inviteeEmail: "", inviteeName: "", message: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ type: "VIEW", inviteeEmail: "", inviteeName: "", message: "" });
      setInviteUrl(null);
    }
  }, [open, reset]);

  const type = watch("type");

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: values.type,
          inviteeEmail: values.inviteeEmail || null,
          inviteeName: values.inviteeName || null,
          message: values.message || null,
          daysValid: 7,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || "غلط درخواست");
        }
        throw new Error(j?.error || "دعوت نہیں بھیجی جا سکی");
      }
      toast.success(j?.message || "Invite sent — دعوت بھیج دی گئی");
      setInviteUrl(j?.invite?.inviteUrl ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>دعوت بھیجیں — Invite</DialogTitle>
          <DialogDescription>خاندان کے افراد کو درخت دیکھنے یا بنانے کی دعوت دیں</DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-3 rounded-xl border bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">دعوت تیار ہے — یہ لنک شیئر کریں:</p>
            <div className="flex items-center gap-1.5">
              <Input readOnly value={inviteUrl} className="h-9 bg-white text-xs" />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  navigator.clipboard?.writeText(inviteUrl).then(
                    () => toast.success("لنک کاپی ہو گیا"),
                    () => toast.error("کاپی نہیں ہو سکا")
                  );
                }}
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setInviteUrl(null)}>
              نئی دعوت بھیجیں
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>دعوت کی قسم — Type</Label>
              <Select value={type} onValueChange={(v) => setValue("type", v as FormValues["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as FormValues["type"][]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">ای میل *</Label>
              <Input id="inv-email" type="email" placeholder="example@email.com" {...register("inviteeEmail")} />
              {errors.inviteeEmail && <p className="text-xs text-red-600">{errors.inviteeEmail.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">نام (اختیاری)</Label>
              <Input id="inv-name" placeholder="مثلاً: چچا جان" {...register("inviteeName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-msg">پیغام (اختیاری)</Label>
              <Textarea id="inv-msg" rows={3} placeholder="You are invited to join this family tree… — آپ کو خاندانی شجرے میں شامل ہونے کی دعوت ہے…" {...register("message")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                منسوخ
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {saving ? "Sending… — بھیجی جا رہی ہے…" : "دعوت بھیجیں"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
