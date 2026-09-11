"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
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
import type { TreeGraphData } from "@/lib/tree-graph";
import type { DuplicateCandidate } from "@/types/tree";
import { fullName } from "@/lib/tree-utils";
import { DuplicateAlert } from "@/components/tree/duplicate-alert";

// ============================================================
// ADD MEMBER MODAL — all member fields + relationship picker
// (parents, spouse). Handles duplicate-detection responses.
// ============================================================

const formSchema = z.object({
  firstName: z.string().trim().min(1, "نام لکھنا ضروری ہے").max(100),
  lastName: z.string().trim().max(100),
  nickName: z.string().trim().max(100),
  gender: z.enum(["MALE", "FEMALE"]),
  dateOfBirth: z.string(),
  dateOfDeath: z.string(),
  isAlive: z.boolean(),
  birthPlace: z.string().trim().max(200),
  deathPlace: z.string().trim().max(200),
  currentCity: z.string().trim().max(200),
  occupation: z.string().trim().max(200),
  education: z.string().trim().max(200),
  bio: z.string().trim().max(2000),
  phone: z.string().trim().max(50),
  email: z
    .union([z.string().trim().email("درست ای میل لکھیں").max(200), z.literal("")]),
  photo: z.string().trim().max(500),
  isPrivate: z.boolean(),
  parentIds: z.array(z.string()).max(2),
  spouseId: z.string(),
  marriageDate: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  graph: TreeGraphData;
  presetParentIds?: string[];
  presetSpouseId?: string;
  presetGender?: "MALE" | "FEMALE";
  onAdded: () => void;
}

export function AddMemberModal({
  open,
  onOpenChange,
  treeId,
  graph,
  presetParentIds,
  presetSpouseId,
  presetGender,
  onAdded,
}: AddMemberModalProps) {
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [blocked, setBlocked] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nickName: "",
      gender: presetGender ?? "MALE",
      dateOfBirth: "",
      dateOfDeath: "",
      isAlive: true,
      birthPlace: "",
      deathPlace: "",
      currentCity: "",
      occupation: "",
      education: "",
      bio: "",
      phone: "",
      email: "",
      photo: "",
      isPrivate: false,
      parentIds: presetParentIds ?? [],
      spouseId: presetSpouseId ?? "",
      marriageDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: "",
        lastName: "",
        nickName: "",
        gender: presetGender ?? "MALE",
        dateOfBirth: "",
        dateOfDeath: "",
        isAlive: true,
        birthPlace: "",
        deathPlace: "",
        currentCity: "",
        occupation: "",
        education: "",
        bio: "",
        phone: "",
        email: "",
        photo: "",
        isPrivate: false,
        parentIds: presetParentIds ?? [],
        spouseId: presetSpouseId ?? "",
        marriageDate: "",
      });
      setDuplicates([]);
      setBlocked(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parentIds = watch("parentIds");
  const gender = watch("gender");
  const isAlive = watch("isAlive");
  const spouseId = watch("spouseId");

  const potentialParents = useMemo(() => {
    const used = new Set(parentIds);
    return graph.members.filter((m) => !used.has(m.id) && m.id !== spouseId);
  }, [graph, parentIds, spouseId]);

  const potentialSpouses = useMemo(
    () => graph.members.filter((m) => m.gender !== gender && !parentIds.includes(m.id)),
    [graph, gender, parentIds]
  );

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setDuplicates([]);
    setBlocked(false);
    try {
      const res = await fetch(`/api/tree/${treeId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName || "",
          nickName: values.nickName || null,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
          dateOfDeath: values.dateOfDeath ? new Date(values.dateOfDeath).toISOString() : null,
          isAlive: values.isAlive,
          birthPlace: values.birthPlace || null,
          deathPlace: values.deathPlace || null,
          currentCity: values.currentCity || null,
          occupation: values.occupation || null,
          education: values.education || null,
          bio: values.bio || null,
          phone: values.phone || null,
          email: values.email || null,
          photo: values.photo || null,
          isPrivate: values.isPrivate,
          parentIds: values.parentIds.length > 0 ? values.parentIds : undefined,
          spouseId: values.spouseId || undefined,
          marriageDate: values.marriageDate ? new Date(values.marriageDate).toISOString() : null,
        }),
      });
      const j = await res.json().catch(() => null);
      if (res.status === 409) {
        setDuplicates(j?.details?.candidates ?? []);
        setBlocked(true);
        toast.error(j?.details?.message || "ممکنہ ڈپلیکیٹ ملا");
        return;
      }
      if (!res.ok) {
        if (j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || "غلط درخواست");
        }
        throw new Error(j?.error || "ممبر شامل نہیں ہو سکا");
      }
      if (j?.warnings?.length > 0) {
        setDuplicates(j.warnings);
        toast.warning(j.message || "ممکنہ ڈپلیکیٹ چیک کریں");
        onOpenChange(false);
        onAdded();
        return;
      }
      toast.success(j?.message || "ممبر شامل ہو گیا");
      onOpenChange(false);
      onAdded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>نیا ممبر شامل کریں — Add Member</DialogTitle>
          <DialogDescription>تمام فیلڈز بھریں — * والی فیلڈز ضروری ہیں</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {duplicates.length > 0 && (
            <DuplicateAlert
              candidates={duplicates}
              blocked={blocked}
              onDismiss={() => setDuplicates([])}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="am-fn">First Name — نام *</Label>
              <Input id="am-fn" placeholder="مثلاً: محمد" {...register("firstName")} className={errors.firstName ? "border-red-400" : ""} />
              {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-ln">Last Name — خاندانی نام</Label>
              <Input id="am-ln" placeholder="مثلاً: خواجہ" {...register("lastName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-nn">Nick Name — عرفیت</Label>
              <Input id="am-nn" {...register("nickName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender — جنس *</Label>
              <Select value={gender} onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male — مرد</SelectItem>
                  <SelectItem value="FEMALE">Female — خاتون</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-dob">Date of Birth — تاریخ پیدائش</Label>
              <Input id="am-dob" type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-dod">Date of Death — تاریخ وفات</Label>
              <Input id="am-dod" type="date" disabled={isAlive} {...register("dateOfDeath")} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={isAlive}
                onChange={(e) => setValue("isAlive", e.target.checked)}
              />
              زندہ ہے (Alive)
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="am-bp">Birth Place — جائے پیدائش</Label>
              <Input id="am-bp" {...register("birthPlace")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-dp">Death Place — جائے وفات</Label>
              <Input id="am-dp" disabled={isAlive} {...register("deathPlace")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-city">Current City — موجودہ شہر</Label>
              <Input id="am-city" {...register("currentCity")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-occ">Occupation — پیشہ</Label>
              <Input id="am-occ" {...register("occupation")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-edu">Education — تعلیم</Label>
              <Input id="am-edu" {...register("education")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-phone">Phone — فون</Label>
              <Input id="am-phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-email">Email — ای میل</Label>
              <Input id="am-email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="am-photo">Photo URL — تصویر کا لنک</Label>
              <Input id="am-photo" placeholder="https://..." {...register("photo")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="am-bio">Bio — تعارف</Label>
              <Textarea id="am-bio" rows={3} {...register("bio")} />
            </div>
          </div>

          {/* relationship picker */}
          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">رشتے — Relationships</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>والد (Father)</Label>
                <Select
                  value={parentIds[0] ?? ""}
                  onValueChange={(v) => {
                    if (!v) return;
                    setValue("parentIds", [v, parentIds[1] ?? ""].filter(Boolean));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="والد منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialParents
                      .filter((m) => m.gender === "MALE")
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {fullName(m)} — {m.gender === "MALE" ? "مرد" : "خاتون"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>والدہ (Mother)</Label>
                <Select
                  value={parentIds[1] ?? ""}
                  onValueChange={(v) => {
                    if (!v) return;
                    setValue("parentIds", [parentIds[0] ?? "", v].filter(Boolean));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="والدہ منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialParents
                      .filter((m) => m.gender === "FEMALE")
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {fullName(m)} — {m.gender === "MALE" ? "مرد" : "خاتون"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>شریک حیات (Spouse)</Label>
                <Select value={spouseId} onValueChange={(v) => setValue("spouseId", v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="شریک حیات منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialSpouses.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {fullName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="am-md">شادی کی تاریخ</Label>
                <Input id="am-md" type="date" {...register("marriageDate")} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register("isPrivate")}
            />
            نجی ممبر (صرف ایڈیٹرز دیکھ سکتے ہیں)
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              منسوخ
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {saving ? "محفوظ ہو رہا ہے..." : "ممبر شامل کریں"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
