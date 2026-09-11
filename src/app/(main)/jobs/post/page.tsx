"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobPostingSchema } from "@/lib/validators";
import { JOB_TYPES } from "@/lib/constants";

const formSchema = jobPostingSchema;
type FormData = z.infer<typeof formSchema>;

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "FULL_TIME",
      currency: "PKR",
      isRemote: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "نوکری پوسٹ نہیں ہو سکی");
        return;
      }
      toast.success("Job post ho gayi! 🎉");
      router.push(`/jobs/${result.id}`);
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="نوکری پوسٹ کریں"
        titleUrdu="نوکری کا اشتہار"
        description="اپنے بزنس کے لیے نوکری پوسٹ کریں (بزنس پروفائل ضروری ہے)"
      />

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <Building2 className="h-5 w-5 shrink-0" />
        Job post karne ke liye business profile hona zaroori hai. Agar nahi hai to pehle{" "}
        <Link href="/business/create" className="font-semibold underline">
          business banayein
        </Link>
        .
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" placeholder="e.g. Sales Manager — Textile Division" {...register("title")} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="نوکری کی مکمل تفصیل لکھیں..."
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                rows={4}
                placeholder="Taleem, tajurba, skills..."
                {...register("requirements")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} — {t.labelUrdu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience">Experience</Label>
                <Input id="experience" placeholder="e.g. 2-3 years" {...register("experience")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salaryMin">Salary Min (PKR)</Label>
                <Input id="salaryMin" type="number" min={0} placeholder="50000" {...register("salaryMin", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salaryMax">Salary Max (PKR)</Label>
                <Input id="salaryMax" type="number" min={0} placeholder="100000" {...register("salaryMax", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Islamabad" {...register("location")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" type="date" {...register("deadline")} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="text-sm font-medium">Remote Job</div>
                <div className="text-xs text-gray-500">Ye job ghar se ki ja sakti hai</div>
              </div>
              <Switch checked={watch("isRemote")} onCheckedChange={(v) => setValue("isRemote", v)} />
            </div>

            <div className="flex gap-3 border-t pt-5">
              <Button type="button" variant="outline" asChild>
                <Link href="/jobs">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "پوسٹ ہو رہی ہے..." : "نوکری پوسٹ کریں"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
