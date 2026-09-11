"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
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
import type { TreeMarriageDto } from "@/types/tree";

// ============================================================
// EDIT MARRIAGE MODAL — Step 16: edit dates/location/status/
// type + remove marriage (divorce via status or full delete).
// ============================================================

const formSchema = z.object({
  date: z.string(),
  endDate: z.string(),
  location: z.string().trim().max(200),
  status: z.enum(["MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "ENGAGED"]),
  type: z.enum(["NIKKAH", "CIVIL", "COURT"]),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMarriageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  marriage: TreeMarriageDto | null;
  spouse1Name: string;
  spouse2Name: string;
  onSaved: () => void;
}

const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export function EditMarriageModal({ open, onOpenChange, treeId, marriage, spouse1Name, spouse2Name, onSaved }: EditMarriageModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: "", endDate: "", location: "", status: "MARRIED", type: "NIKKAH" },
  });

  useEffect(() => {
    if (open && marriage) {
      reset({
        date: toDateInput(marriage.date),
        endDate: toDateInput(marriage.endDate),
        location: marriage.location ?? "",
        status: marriage.status,
        type: marriage.type,
      });
      setConfirmDelete(false);
    }
  }, [open, marriage, reset]);

  if (!marriage) return null;

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/marriages/${marriage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: values.date ? new Date(values.date).toISOString() : null,
          endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
          location: values.location || null,
          status: values.status,
          type: values.type,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "شادی اپ ڈیٹ نہیں ہوئی");
      toast.success(j?.message || "شادی اپ ڈیٹ ہو گئی");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/marriages/${marriage.id}`, {
        method: "DELETE",
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "شادی نہیں ہٹی");
      toast.success(j?.message || "شادی ہٹا دی گئی");
      setConfirmDelete(false);
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setDeleting(false);
    }
  };

  const status = watch("status");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>شادی میں ترمیم — Edit Marriage</DialogTitle>
            <DialogDescription>
              {spouse1Name} ⚭ {spouse2Name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emg-date">شادی کی تاریخ</Label>
                <Input id="emg-date" type="date" {...register("date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emg-end">اختتام کی تاریخ</Label>
                <Input id="emg-end" type="date" {...register("endDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emg-loc">مقام — Location</Label>
                <Input id="emg-loc" {...register("location")} />
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
              <div className="space-y-1.5">
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

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              طلاق کے لیے حیثیت کو DIVORCED منتخب کریں اور اختتام کی تاریخ دیں
            </p>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                شادی ڈیلیٹ کریں
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  منسوخ
                </Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>شادی ڈیلیٹ کریں؟</AlertDialogTitle>
            <AlertDialogDescription>
              یہ شادی مکمل طور پر ہٹ جائے گی۔ طلاق کے لیے DELETE کے بجائے DIVORCED status استعمال کرنا بہتر ہے۔
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>منسوخ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                remove();
              }}
            >
              {deleting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
              جی ہاں، ڈیلیٹ کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
