"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rishtaProfileSchema } from "@/lib/validators";
import { COMPLEXIONS, EDUCATION_LEVELS, SECTS, MARITAL_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MarriageFormStep } from "@/components/rishta/marriage-form-step";


const formSchema = rishtaProfileSchema;
type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { title: "Personal", titleUrdu: "ذاتی معلومات" },
  { title: "Professional", titleUrdu: "تعلیم و پیشہ" },
  { title: "Religious & Preferences", titleUrdu: "مذہب و ترجیحات" },
  { title: "Marriage Form", titleUrdu: "تفصیلی فارم" },
  { title: "About", titleUrdu: "تعارف" },
  { title: "Guardian Mode", titleUrdu: "سرپرست" },
  { title: "Photos", titleUrdu: "تصاویر" },
];

export default function CreateRishtaPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 25,
      maritalStatus: "NEVER_MARRIED",
      children: 0,
      photos: [],
      isGuardianMode: false,
    },
  });

  const photos = watch("photos") || [];
  const isGuardianMode = watch("isGuardianMode");

  const handleUpload = async (file: File) => {
    if (photos.length >= 5) {
      toast.error("زیادہ سے زیادہ 5 تصاویر اپ لوڈ کر سکتے ہیں");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "اپ لوڈ نہیں ہو سکا");
        return;
      }
      setValue("photos", [...photos, data.url]);
      toast.success("تصویر اپ لوڈ ہو گئی");
    } catch {
      toast.error("اپ لوڈ میں مسئلہ آ گیا");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!(data as any).marriageForm?.oathAccepted) {
      toast.error("حلف نامہ ضروری ہے — براہ کرم تصدیق کریں کہ معلومات درست ہیں");
      setStep(STEPS.findIndex((st) => st.title === "Marriage Form"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rishta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "پروفائل محفوظ نہیں ہو سکی");
        return;
      }
      toast.success("رشتہ پروفائل بن گیا! 💚");
      router.push(`/rishta/${result.id}`);
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create Rishta Profile" titleUrdu="رشتہ پروفائل بنائیں" description="اپنے بارے میں بتائیں — 7 آسان مراحل" />

      {/* Progress */}
      <div className="mb-6">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="font-medium text-emerald-700">
            {STEPS[step].title} · <span className="font-urdu">{STEPS[step].titleUrdu}</span>
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal */}
            <div className={cn("space-y-4", step !== 0 && "hidden")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>عمر (سال) *</Label>
                  <Input type="number" min={18} max={80} {...register("age", { valueAsNumber: true })} />
                  {errors.age && <p className="text-xs text-red-600">{errors.age.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Height</Label>
                  <Input placeholder="e.g. 5'8&quot;" {...register("height")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Weight</Label>
                  <Input placeholder="e.g. 70 kg" {...register("weight")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Complexion</Label>
                  <Select onValueChange={(v) => setValue("complexion", v)} value={watch("complexion") || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLEXIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Marital Status</Label>
                  <Select value={watch("maritalStatus") || "NEVER_MARRIED"} onValueChange={(v) => setValue("maritalStatus", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUSES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label} — {m.labelUrdu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Children</Label>
                  <Input type="number" min={0} max={20} {...register("children", { valueAsNumber: true })} />
                </div>
              </div>
            </div>

            {/* Step 2: Professional */}
            <div className={cn("space-y-4", step !== 1 && "hidden")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Education</Label>
                  <Select onValueChange={(v) => setValue("education", v)} value={watch("education") || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Education Detail</Label>
                  <Input placeholder="e.g. M.A. English, Karachi University" {...register("educationDetail")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Profession</Label>
                  <Input placeholder="e.g. Teacher" {...register("profession")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Income</Label>
                  <Input placeholder="e.g. PKR 80,000 - 100,000" {...register("income")} />
                </div>
              </div>
            </div>

            {/* Step 3: Religious & Preferences */}
            <div className={cn("space-y-4", step !== 2 && "hidden")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Sect</Label>
                  <Select onValueChange={(v) => setValue("sect", v)} value={watch("sect") || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="منتخب کریں" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Maslak</Label>
                  <Input placeholder="e.g. Hanafi" {...register("maslak")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Caste / Clan Preference</Label>
                  <Input placeholder="e.g. Arain preferred" {...register("castePreference")} />
                </div>
                <div className="space-y-1.5">
                  <Label>City Preference</Label>
                  <Input placeholder="e.g. Karachi" {...register("cityPreference")} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Country Preference</Label>
                  <Input placeholder="e.g. Pakistan" {...register("countryPreference")} />
                </div>
              </div>
            </div>

            {/* Step 5: About */}
            <div className={cn("space-y-4", step !== 4 && "hidden")}>
              <div className="space-y-1.5">
                <Label>About Me</Label>
                <Textarea rows={4} placeholder="اپنے بارے میں لکھیں — شخصیت، مشاغل، طرزِ زندگی..." {...register("about")} />
              </div>
              <div className="space-y-1.5">
                <Label>Family Background</Label>
                <Textarea rows={4} placeholder="اپنے خاندان کے بارے میں لکھیں..." {...register("familyBackground")} />
              </div>
              <div className="space-y-1.5">
                <Label>Expectations</Label>
                <Textarea rows={4} placeholder="آپ کیسا رشتہ چاہتے ہیں؟" {...register("expectations")} />
              </div>
            </div>

            {/* Step 6: Guardian Mode */}
            {/* Step 4: Marriage Form (Khawajgan) */}
            <div className={cn("space-y-4", step !== 3 && "hidden")}>
              <MarriageFormStep register={register} watch={watch} setValue={setValue} errors={errors} />
            </div>
            <div className={cn("space-y-4", step !== 5 && "hidden")}>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="text-sm font-medium">Guardian Mode</div>
                  <div className="text-xs text-gray-500">
                    گارڈین موڈ آن کرنے پر درخواستیں سیدھی گارڈین کے پاس جائیں گی (خواتین پروفائلز کے لیے تجویز کردہ)
                  </div>
                </div>
                <Switch checked={isGuardianMode} onCheckedChange={(v) => setValue("isGuardianMode", v)} />
              </div>
              {isGuardianMode && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Guardian Name</Label>
                    <Input placeholder="e.g. Muhammad Yousuf" {...register("guardianName")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rishta (Relation)</Label>
                    <Input placeholder="e.g. Father (Walid)" {...register("guardianRelation")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Guardian Phone</Label>
                    <Input placeholder="03001234567" {...register("guardianPhone")} />
                  </div>
                </div>
              )}
            </div>

            {/* Step 7: Photos */}
            <div className={cn("space-y-4", step !== 6 && "hidden")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Photo ${i + 1}`} className="h-28 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setValue("photos", photos.filter((_, idx) => idx !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-center transition-colors hover:border-pink-300 hover:bg-pink-50/40">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="mt-1 text-[10px] text-gray-500">{uploading ? "Upload..." : "تصویر شامل کریں"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">
                نوٹ: تصاویر صرف تصدیق شدہ صارفین کو دکھائی دیتی ہیں۔ غیر تصدیق شدہ صارفین کے لیے تصاویر دھندلی رہتی ہیں۔
              </p>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex gap-3 border-t pt-5">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={prev}>
                  <ArrowLeft className="mr-1 h-4 w-4" />پچھلا</Button>
              ) : (
                <Button type="button" variant="outline" asChild>
                  <Link href="/rishta">منسوخ</Link>
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="button" className="flex-1 bg-pink-600 hover:bg-pink-700" onClick={next}>اگلا<ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700" disabled={loading || uploading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  {loading ? "محفوظ ہو رہا ہے..." : "پروفائل محفوظ کریں"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
