"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { T } from "@/lib/i18n";
import type { TreeGraphData } from "@/lib/tree-graph";
import { fullName } from "@/lib/tree-utils";

// ============================================================
// QUICK ADD MODAL — simplified relative form (name + DOB only).
// Gender auto-set from the clicked button; for SON/DAUGHTER with
// multiple spouses, asks which spouse is the other parent.
// ============================================================

export type QuickAddType = "FATHER" | "MOTHER" | "BROTHER" | "SISTER" | "HUSBAND" | "WIFE" | "SON" | "DAUGHTER";

const RELATION_LABELS: Record<QuickAddType, { en: string; ur: string; addedToast: string }> = {
  FATHER: { en: "Father", ur: "والد", addedToast: T.tree.fatherAdded },
  MOTHER: { en: "Mother", ur: "والدہ", addedToast: T.tree.motherAdded },
  BROTHER: { en: "Brother", ur: "بھائی", addedToast: T.tree.brotherAdded },
  SISTER: { en: "Sister", ur: "بہن", addedToast: T.tree.sisterAdded },
  HUSBAND: { en: "Husband", ur: "شوہر", addedToast: T.tree.husbandAdded },
  WIFE: { en: "Wife", ur: "بیوی", addedToast: T.tree.wifeAdded },
  SON: { en: "Son", ur: "بیٹا", addedToast: T.tree.sonAdded },
  DAUGHTER: { en: "Daughter", ur: "بیٹی", addedToast: T.tree.daughterAdded },
};

const quickAddSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required — نام لکھنا ضروری ہے").max(100),
  lastName: z.string().trim().max(100).optional(),
  dateOfBirth: z.string().trim().optional(),
  motherId: z.string().trim().optional(),
  fatherName: z.string().trim().max(100).optional(),
});

type QuickAddForm = z.infer<typeof quickAddSchema>;

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  memberId: string; // selected member
  relationType: QuickAddType;
  onAdded: () => void;
}

export function QuickAddModal({ open, onOpenChange, treeId, graph, memberId, relationType, onAdded }: QuickAddModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const member = graph.memberById.get(memberId);
  const rel = RELATION_LABELS[relationType];

  // Spouses of the selected member (potential co-parent for SON/DAUGHTER)
  const spouses = useMemo(() => (member ? graph.spousesOf(member.id).map((s) => s.spouse) : []), [member, graph]);
  const needsMother = relationType === "SON" || relationType === "DAUGHTER";
  const showMotherSelect = needsMother && spouses.length > 1;
  // FIX — sibling of a parentless member: the only way to connect the new
  // sibling to the tree is a shared father (GenoPro-style). Ask for his name.
  const hasParents = member ? (graph.parentIdsOf.get(member.id) ?? []).length > 0 : true;
  const needsFather = (relationType === "BROTHER" || relationType === "SISTER") && !hasParents;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuickAddForm>({
    resolver: zodResolver(
      // STRICT — multi-spouse member + SON/DAUGHTER: motherId is required so
      // the child lands in the correct family unit (matches the API rule).
      quickAddSchema.refine(
        (v) => !(needsMother && spouses.length > 1) || Boolean(v.motherId && v.motherId.trim()),
        { message: "Mother selection is required — والدہ کا انتخاب ضروری ہے", path: ["motherId"] }
      )
    ),
    defaultValues: { firstName: "", lastName: "", dateOfBirth: "", motherId: "", fatherName: "" },
  });
  const motherIdValue = watch("motherId");
  const submitDisabled = submitting || (needsMother && spouses.length > 1 && !(motherIdValue && motherIdValue.trim()));

  const onSubmit = async (values: QuickAddForm) => {
    if (needsFather && !(values.fatherName ?? "").trim()) {
      toast.error(T.tree.fatherNameRequired);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/members/quick-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedMemberId: memberId,
          relationshipType: relationType,
          firstName: values.firstName,
          lastName: values.lastName || undefined,
          dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
          motherId: values.motherId || undefined,
          fatherName: values.fatherName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || T.error.saveFailed);
        return;
      }
      toast.success(rel.addedToast);
      reset();
      onOpenChange(false);
      onAdded();
    } catch {
      toast.error(T.common.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] w-full overflow-y-auto rounded-none sm:h-auto sm:max-h-[95vh] sm:max-w-md sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>
            Add {rel.en} — {rel.ur} شامل کریں
          </DialogTitle>
          <DialogDescription>
            {member ? `${T.tree.quickAddDescription.replace("{name}", fullName(member))} — ${rel.ur} کا ڈیٹا صرف نام اور تاریخ پیدائش ہے` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qa-firstName">{T.profile.firstName} *</Label>
            <Input
              id="qa-firstName"
              placeholder={T.profile.firstNamePlaceholder}
              {...register("firstName")}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-lastName">{T.profile.lastName} ({T.common.optional})</Label>
            <Input id="qa-lastName" placeholder={T.profile.lastNamePlaceholder} {...register("lastName")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-dob">{T.tree.dateOfBirthLabel} ({T.common.optional})</Label>
            <Input id="qa-dob" type="date" placeholder={T.tree.dateOfBirthPlaceholder} {...register("dateOfBirth")} />
          </div>

          {showMotherSelect && (
            <div className="space-y-1.5">
              <Label>
                {T.tree.motherLabel}
                {spouses.length > 1 && <span className="text-red-500"> *</span>}
              </Label>
              <Select value={motherIdValue || undefined} onValueChange={(v) => setValue("motherId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={T.tree.selectMother} />
                </SelectTrigger>
                <SelectContent>
                  {spouses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {fullName(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.motherId && (
                <p className="text-xs text-red-500">{errors.motherId.message}</p>
              )}
              {spouses.length > 1 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {T.tree.motherRequiredNote}
                </p>
              )}
            </div>
          )}

          {needsFather && (
            <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {T.tree.siblingNeedsFather.replaceAll("{relation}", rel.en)}
              </p>
              <Label htmlFor="qa-fatherName">{T.tree.fatherNameLabel} *</Label>
              <Input
                id="qa-fatherName"
                placeholder={T.tree.fatherNamePlaceholder}
                {...register("fatherName")}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {T.common.cancel}
            </Button>
            <Button type="submit" disabled={submitDisabled} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add {rel.en} — {rel.ur} شامل کریں
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
