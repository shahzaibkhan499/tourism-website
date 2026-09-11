"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
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
import { memorySchema } from "@/lib/validators";
import { MEMORY_CATEGORIES } from "@/lib/constants";

const formSchema = memorySchema;
type FormData = z.infer<typeof formSchema>;

interface UploadedMedia {
  url: string;
  publicId: string | null;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  size: number | null;
  mimeType: string | null;
}

export default function CreateMemoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "OTHER",
      isPublic: false,
    },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upload nahi ho saka");
        return;
      }
      setMediaList((prev) => [
        ...prev,
        { url: data.url, publicId: data.publicId, type: data.type, size: data.size, mimeType: data.mimeType },
      ]);
      toast.success("Media upload ho gayi");
    } catch {
      toast.error("Upload mein masla aa gaya");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, media: mediaList }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Memory save nahi ho saki");
        return;
      }
      toast.success("Memory mehfooz ho gayi! 📸");
      router.push("/memories");
    } catch {
      toast.error("Network error. Dobara koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nayi Memory Banayein" titleUrdu="نئی یاد" description="Khaas lamhe mehfooz karein" />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="e.g. Swat ka Family Trip" {...register("title")} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} placeholder="Is lamhe ki kahani likhein..." {...register("description")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Swat Valley" {...register("location")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={watch("category") || "OTHER"} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMORY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.emoji} {c.label} — {c.labelUrdu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="text-sm font-medium">Public Memory</div>
                <div className="text-xs text-gray-500">Public memory aapki clan ke members dekh sakte hain</div>
              </div>
              <Switch checked={watch("isPublic")} onCheckedChange={(v) => setValue("isPublic", v)} />
            </div>

            {/* Media upload */}
            <div className="space-y-2">
              <Label>Photos / Videos</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/40">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">
                  {uploading ? "Upload ho raha hai..." : "Yahan click karein ya file drag karein (photos, videos, documents)"}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*,audio/*,application/pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
              {mediaList.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaList.map((m, i) => (
                    <div key={i} className="relative">
                      {m.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="h-20 w-full rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-gray-100 text-2xl">
                          {m.type === "VIDEO" ? "🎬" : m.type === "AUDIO" ? "🎵" : "📄"}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setMediaList(mediaList.filter((_, idx) => idx !== i))}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                        aria-label="Remove media"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t pt-5">
              <Button type="button" variant="outline" asChild>
                <Link href="/memories">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading || uploading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Save ho raha hai..." : "Memory Save Karein"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
