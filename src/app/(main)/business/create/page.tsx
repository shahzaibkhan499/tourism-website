"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
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
import { businessSchema } from "@/lib/validators";
import { INDUSTRIES, PAKISTANI_CITIES, PAKISTANI_PROVINCES } from "@/lib/constants";

const formSchema = businessSchema;
type FormData = z.infer<typeof formSchema>;

export default function CreateBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [socials, setSocials] = useState<Array<{ platform: string; url: string }>>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isFamilyOwned: true,
    },
  });

  const logo = watch("logo");
  const coverImage = watch("coverImage");

  const handleUpload = async (file: File, field: "logo" | "coverImage") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "اپ لوڈ نہیں ہو سکا");
        return;
      }
      setValue(field, data.url);
      toast.success("Image upload ho gayi");
    } catch {
      toast.error("اپ لوڈ میں مسئلہ آ گیا");
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, socialLinks: socials }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "بزنس رجسٹر نہیں ہو سکا");
        return;
      }
      toast.success("بزنس رجسٹر ہو گیا! 🎉");
      router.push(`/business/${result.id}`);
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="بزنس رجسٹر کریں" titleUrdu="کاروبار" description="اپنا بزنس ڈائریکٹری میں شامل کریں" />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business Name *</Label>
              <Input id="name" placeholder="e.g. Khan Textiles" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} placeholder="بزنس کے بارے میں لکھیں..." {...register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select onValueChange={(v) => setValue("industry", v)} value={watch("industry") || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g. Clothing & Fabric" {...register("category")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="03001234567" {...register("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="info@business.pk" {...register("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="www.business.pk" {...register("website")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Shop #, Market, Area" {...register("address")} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Select onValueChange={(v) => setValue("city", v)} value={watch("city") || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {PAKISTANI_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Province</Label>
                <Select onValueChange={(v) => setValue("province", v)} value={watch("province") || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAKISTANI_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Images */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Logo</Label>
                <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-emerald-300">
                  {logo ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setValue("logo", "")}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "logo");
                    }}
                  />
                </label>
              </div>
              <div className="space-y-1.5">
                <Label>Cover Image</Label>
                <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-emerald-300">
                  {coverImage ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImage} alt="Cover" className="h-16 w-28 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setValue("coverImage", "")}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "coverImage");
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Social links */}
            <div className="space-y-2">
              <Label>Social Links</Label>
              {socials.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Select
                    value={s.platform}
                    onValueChange={(v) => setSocials(socials.map((x, idx) => (idx === i ? { ...x, platform: v } : x)))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="https://..."
                    value={s.url}
                    onChange={(e) => setSocials(socials.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSocials(socials.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSocials([...socials, { platform: "facebook", url: "" }])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Social Link Add Karein
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="text-sm font-medium">Family-Owned Business</div>
                <div className="text-xs text-gray-500">Ye business khandaan ki milkiyat hai</div>
              </div>
              <Switch checked={watch("isFamilyOwned")} onCheckedChange={(v) => setValue("isFamilyOwned", v)} />
            </div>

            <div className="flex gap-3 border-t pt-5">
              <Button type="button" variant="outline" asChild>
                <Link href="/business">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "رجسٹر ہو رہا ہے..." : "بزنس رجسٹر کریں"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
