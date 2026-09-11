"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import type { TreeMemberDto } from "@/types/tree";

// ============================================================
// EDIT MEMBER MODAL — pre-filled form for all member fields.
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
  email: z.union([z.string().trim().email("درست ای میل لکھیں").max(200), z.literal("")]),
  photo: z.string().trim().max(500),
  isPrivate: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  member: TreeMemberDto | null;
  onSaved: () => void;
}

const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export function EditMemberModal({ open, onOpenChange, treeId, member, onSaved }: EditMemberModalProps) {
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
    defaultValues: {
      firstName: "",
      lastName: "",
      nickName: "",
      gender: "MALE",
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
    },
  });

  useEffect(() => {
    if (open && member) {
      reset({
        firstName: member.firstName,
        lastName: member.lastName,
        nickName: member.nickName ?? "",
        gender: member.gender === "MALE" ? "MALE" : "FEMALE",
        dateOfBirth: toDateInput(member.dateOfBirth),
        dateOfDeath: toDateInput(member.dateOfDeath),
        isAlive: member.isAlive,
        birthPlace: member.birthPlace ?? "",
        deathPlace: member.deathPlace ?? "",
        currentCity: member.currentCity ?? "",
        occupation: member.occupation ?? "",
        education: member.education ?? "",
        bio: member.bio ?? "",
        phone: member.phone ?? "",
        email: member.email ?? "",
        photo: member.photo ?? "",
        isPrivate: member.isPrivate,
      });
    }
  }, [open, member, reset]);

  const gender = watch("gender");
  const isAlive = watch("isAlive");

  const onSubmit = async (values: FormValues) => {
    if (!member) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/members/${member.id}`, {
        method: "PUT",
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
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || "غلط درخواست");
        }
        throw new Error(j?.error || "اپ ڈیٹ نہیں ہو سکا");
      }
      toast.success(j?.message || "ممبر اپ ڈیٹ ہو گیا");
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
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ممبر کی ترمیم — Edit Member</DialogTitle>
          <DialogDescription>
            {member ? `«${member.firstName} ${member.lastName}» کی تفصیلات بدلیں` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="em-fn">First Name — نام *</Label>
              <Input id="em-fn" {...register("firstName")} className={errors.firstName ? "border-red-400" : ""} />
              {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-ln">Last Name — خاندانی نام</Label>
              <Input id="em-ln" {...register("lastName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-nn">Nick Name — عرفیت</Label>
              <Input id="em-nn" {...register("nickName")} />
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
              <Label htmlFor="em-dob">Date of Birth — تاریخ پیدائش</Label>
              <Input id="em-dob" type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-dod">Date of Death — تاریخ وفات</Label>
              <Input id="em-dod" type="date" disabled={isAlive} {...register("dateOfDeath")} />
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
              <Label htmlFor="em-bp">Birth Place — جائے پیدائش</Label>
              <Input id="em-bp" {...register("birthPlace")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-dp">Death Place — جائے وفات</Label>
              <Input id="em-dp" disabled={isAlive} {...register("deathPlace")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-city">Current City — موجودہ شہر</Label>
              <Input id="em-city" {...register("currentCity")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-occ">Occupation — پیشہ</Label>
              <Input id="em-occ" {...register("occupation")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-edu">Education — تعلیم</Label>
              <Input id="em-edu" {...register("education")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-phone">Phone — فون</Label>
              <Input id="em-phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="em-email">Email — ای میل</Label>
              <Input id="em-email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="em-photo">Photo URL — تصویر کا لنک</Label>
              <Input id="em-photo" placeholder="https://..." {...register("photo")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="em-bio">Bio — تعارف</Label>
              <Textarea id="em-bio" rows={3} {...register("bio")} />
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
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "محفوظ ہو رہا ہے..." : "محفوظ کریں"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
