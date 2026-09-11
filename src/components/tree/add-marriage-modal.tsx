"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { HeartHandshake, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TreeGraphData } from "@/lib/tree-graph";
import { fullName } from "@/lib/tree-utils";

// ============================================================
// ADD MARRIAGE MODAL — add/edit marriage: spouses, dates,
// status (married/divorced/widowed/separated/engaged), type.
// ============================================================

const formSchema = z.object({
  spouse1Id: z.string().min(1, "پہلا شریک حیات منتخب کریں"),
  spouse2Id: z.string().min(1, "دوسرا شریک حیات منتخب کریں"),
  date: z.string(),
  endDate: z.string(),
  location: z.string().trim().max(200),
  status: z.enum(["MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "ENGAGED"]),
  type: z.enum(["NIKKAH", "CIVIL", "COURT"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMarriageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  presetSpouseId?: string;
  onSaved: () => void;
}

export function AddMarriageModal({ open, onOpenChange, treeId, graph, presetSpouseId, onSaved }: AddMarriageModalProps) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { spouse1Id: presetSpouseId ?? "", spouse2Id: "", date: "", endDate: "", location: "", status: "MARRIED", type: "NIKKAH" },
  });

  useEffect(() => {
    if (open) {
      reset({ spouse1Id: presetSpouseId ?? "", spouse2Id: "", date: "", endDate: "", location: "", status: "MARRIED", type: "NIKKAH" });
    }
  }, [open, presetSpouseId, reset]);

  const spouse1Id = watch("spouse1Id");
  const status = watch("status");

  const spouse1 = spouse1Id ? graph.memberById.get(spouse1Id) : undefined;
  const spouse2Options = useMemo(
    () => graph.members.filter((m) => m.id !== spouse1Id && (!spouse1 || m.gender !== spouse1.gender)),
    [graph.members, spouse1Id, spouse1]
  );

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/marriages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spouse1Id: values.spouse1Id,
          spouse2Id: values.spouse2Id,
          date: values.date ? new Date(values.date).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          location: values.location || null,
          status: values.status,
          type: values.type,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || "غلط درخواست");
        }
        throw new Error(j?.error || "شادی درج نہیں ہوئی");
      }
      toast.success(j?.message || "شادی درج ہو گئی");
      onOpenChange(false);
      onSaved();
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
          <DialogTitle>شادی شامل کریں — Add Marriage</DialogTitle>
          <DialogDescription>میاں اور بیوی کا انتخاب کریں — ایک شخص کی کئی شادیاں ہو سکتی ہیں</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>شوہر (Husband)</Label>
            <Select value={spouse1Id} onValueChange={(v) => setValue("spouse1Id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="شوہر منتخب کریں" />
              </SelectTrigger>
              <SelectContent>
                {graph.members
                  .filter((m) => m.gender === "MALE")
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {fullName(m)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.spouse1Id && <p className="text-xs text-red-600">{errors.spouse1Id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>بیوی (Wife)</Label>
            <Select value={watch("spouse2Id")} onValueChange={(v) => setValue("spouse2Id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="بیوی منتخب کریں" />
              </SelectTrigger>
              <SelectContent>
                {spouse2Options
                  .filter((m) => m.gender === "FEMALE")
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {fullName(m)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.spouse2Id && <p className="text-xs text-red-600">{errors.spouse2Id.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mar-date">شادی کی تاریخ</Label>
              <Input id="mar-date" type="date" {...register("date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mar-end">اختتام کی تاریخ</Label>
              <Input id="mar-end" type="date" {...register("endDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mar-loc">مقام — Location</Label>
              <Input id="mar-loc" {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label>حیثیت — Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as FormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARRIED">Married — شادی شدہ</SelectItem>
                  <SelectItem value="DIVORCED">Divorced — طلاق</SelectItem>
                  <SelectItem value="WIDOWED">Widowed — بیوہ/بیوہ ہوئی</SelectItem>
                  <SelectItem value="SEPARATED">Separated — علیحدہ</SelectItem>
                  <SelectItem value="ENGAGED">Engaged — منگنی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>قسم — Type</Label>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v as FormValues["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIKKAH">Nikkah — نکاح</SelectItem>
                  <SelectItem value="CIVIL">Civil — سول</SelectItem>
                  <SelectItem value="COURT">Court — عدالتی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              منسوخ
            </Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HeartHandshake className="mr-2 h-4 w-4" />}
              {saving ? "محفوظ ہو رہا ہے..." : "شادی درج کریں"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
