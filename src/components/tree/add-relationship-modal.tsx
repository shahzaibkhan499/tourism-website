"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Link2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
// ADD RELATIONSHIP MODAL — parent-child link with type
// (biological/adopted/step/guardian/foster).
// ============================================================

const formSchema = z.object({
  parentId: z.string().min(1, "والدین منتخب کریں"),
  childId: z.string().min(1, "بچہ منتخب کریں"),
  type: z.enum(["BIOLOGICAL", "ADOPTED", "STEP", "GUARDIAN", "FOSTER"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddRelationshipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  presetChildId?: string;
  onSaved: () => void;
}

export function AddRelationshipModal({ open, onOpenChange, treeId, graph, presetChildId, onSaved }: AddRelationshipModalProps) {
  const [saving, setSaving] = useState(false);
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { parentId: "", childId: presetChildId ?? "", type: "BIOLOGICAL" },
  });

  useEffect(() => {
    if (open) reset({ parentId: "", childId: presetChildId ?? "", type: "BIOLOGICAL" });
  }, [open, presetChildId, reset]);

  const parentId = watch("parentId");
  const childId = watch("childId");

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || "غلط درخواست");
        }
        throw new Error(j?.error || "رشتہ نہیں بنا سکا");
      }
      toast.success(j?.message || "رشتہ شامل ہو گیا");
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
          <DialogTitle>والدین-بچے کا رشتہ — Add Relationship</DialogTitle>
          <DialogDescription>بچے کے والد یا والدہ کا انتخاب کریں (زیادہ سے زیادہ 2 والدین)</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>والدین (Parent)</Label>
            <Select value={parentId} onValueChange={(v) => setValue("parentId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="والدین منتخب کریں" />
              </SelectTrigger>
              <SelectContent>
                {graph.members
                  .filter((m) => m.id !== childId)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {fullName(m)} — {m.gender === "MALE" ? "مرد" : "خاتون"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.parentId && <p className="text-xs text-red-600">{errors.parentId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>بچہ (Child)</Label>
            <Select value={childId} onValueChange={(v) => setValue("childId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="بچہ منتخب کریں" />
              </SelectTrigger>
              <SelectContent>
                {graph.members
                  .filter((m) => m.id !== parentId)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {fullName(m)} — جنریشن {m.generation}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.childId && <p className="text-xs text-red-600">{errors.childId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>رشتے کی قسم — Relationship Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v as FormValues["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BIOLOGICAL">Biological — حقیقی</SelectItem>
                <SelectItem value="ADOPTED">Adopted — لے پالک</SelectItem>
                <SelectItem value="STEP">Step — سوتیلا</SelectItem>
                <SelectItem value="GUARDIAN">Guardian — سرپرست</SelectItem>
                <SelectItem value="FOSTER">Foster — رضاعی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              منسوخ
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {saving ? "محفوظ ہو رہا ہے..." : "رشتہ شامل کریں"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
