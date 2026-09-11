"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Network } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const formSchema = z.object({
  name: z.string().trim().min(1, "درخت کا نام لکھنا ضروری ہے").max(120),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["PRIVATE", "COLLABORATORS", "CLAN_ONLY", "REGISTERED", "PUBLIC"]),
  includeRoot: z.boolean(),
  rootFirstName: z.string().trim().max(100),
  rootLastName: z.string().trim().max(100),
  rootGender: z.enum(["MALE", "FEMALE"]),
  rootDob: z.string().trim().max(20),
});

type FormValues = z.infer<typeof formSchema>;

const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Private", urdu: "نجی — صرف آپ" },
  { value: "COLLABORATORS", label: "Collaborators", urdu: "ساتھی — جنہیں آپ مدعو کریں" },
  { value: "CLAN_ONLY", label: "Clan Only", urdu: "صرف آپ کے کلان کے لوگ" },
  { value: "REGISTERED", label: "Registered", urdu: "تمام رجسٹرڈ صارفین" },
  { value: "PUBLIC", label: "Public", urdu: "عوامی — سب دیکھ سکتے ہیں" },
];

export default function CreateTreePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PRIVATE",
      includeRoot: true,
      rootFirstName: "",
      rootLastName: "",
      rootGender: "MALE",
      rootDob: "",
    },
  });

  const includeRoot = watch("includeRoot");
  const visibility = watch("visibility");

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch("/api/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          visibility: values.visibility,
          isPublic: values.visibility === "PUBLIC",
          rootMember: values.includeRoot
            ? {
                firstName: values.rootFirstName,
                lastName: values.rootLastName,
                gender: values.rootGender,
                dateOfBirth: values.rootDob ? new Date(values.rootDob).toISOString() : null,
              }
            : null,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 400 && j?.details && typeof j.details === "object") {
          const first = Object.values(j.details).flat()[0];
          throw new Error(typeof first === "string" ? first : j.error || "غلط درخواست");
        }
        throw new Error(j?.error || "شجرہ نہیں بن سکا");
      }
      toast.success(j?.message || "شجرہ بن گیا!");
      router.push(`/tree/${j.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create Family Tree" titleUrdu="نیا شجرہ نسب" />
      <Button variant="ghost" size="sm" className="mb-4 -mt-2" asChild>
        <Link href="/tree">
          <ArrowLeft className="mr-1 h-4 w-4" />
          واپس — تمام شجرے
        </Link>
      </Button>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>شجرے کی معلومات</CardTitle>
            <CardDescription>اپنے خاندان کے شجرے کا نام اور رازداری کی ترتیب</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Tree Name — نام *</Label>
              <Input
                id="name"
                placeholder="مثلاً: خواجہ خاندان کا شجرہ"
                {...register("name")}
                className={errors.name ? "border-red-400" : ""}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description — تفصیل</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="اس شجرے کے بارے میں مختصر تعارف"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Visibility — رازداری</Label>
              <Select value={visibility} onValueChange={(v) => setValue("visibility", v as FormValues["visibility"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label} — {o.urdu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>پہلا ممبر (Root)</CardTitle>
            <CardDescription>شجرے کی جڑ — عموماً سب سے بڑے بزرگ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={includeRoot}
                onChange={(e) => setValue("includeRoot", e.target.checked)}
              />
              ابھی پہلا ممبر شامل کریں
            </label>

            {includeRoot && (
              <div className="space-y-4 rounded-lg border bg-gray-50/60 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rf">First Name — نام</Label>
                    <Input id="rf" placeholder="مثلاً: محمد" {...register("rootFirstName")} />
                    {errors.rootFirstName && (
                      <p className="text-xs text-red-600">{errors.rootFirstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rl">Last Name — خاندانی نام</Label>
                    <Input id="rl" placeholder="مثلاً: خواجہ" {...register("rootLastName")} />
                    {errors.rootLastName && (
                      <p className="text-xs text-red-600">{errors.rootLastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender — جنس</Label>
                    <Select value={watch("rootGender")} onValueChange={(v) => setValue("rootGender", v as "MALE" | "FEMALE")}>
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
                    <Label htmlFor="rd">Date of Birth — تاریخ پیدائش</Label>
                    <Input id="rd" type="date" {...register("rootDob")} />
                    {errors.rootDob && <p className="text-xs text-red-600">{errors.rootDob.message}</p>}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            منسوخ
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Network className="mr-2 h-4 w-4" />}
            {saving ? "بن رہا ہے..." : "شجرہ بنائیں"}
          </Button>
        </div>
      </form>
    </div>
  );
}
