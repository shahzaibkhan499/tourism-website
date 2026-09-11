"use client";

import { optimizeImageUrl } from "@/lib/utils";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

// ============================================================
// GROUP PHOTOS + FACE TAGGING — upload family photos, tap a
// face to tag a member at that position (x/y 0..1).
// ============================================================

interface GroupPhotosProps {
  treeId: string;
  memberIds: { id: string; label: string }[];
}

interface PhotoDto {
  id: string;
  url: string;
  caption: string | null;
  date: string | null;
  location: string | null;
  createdAt: string;
  tags: { id: string; memberId: string; x: number; y: number; member: { id: string; firstName: string; lastName: string } }[];
}

export function GroupPhotos({ treeId, memberIds }: GroupPhotosProps) {
  const [photos, setPhotos] = useState<PhotoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [tagging, setTagging] = useState<{ photoId: string; x: number; y: number } | null>(null);
  const [tagMemberId, setTagMemberId] = useState("");
  const [removing, setRemoving] = useState<PhotoDto | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/photos`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "تصاویر لوڈ نہیں ہوئیں");
      setPhotos(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caption", caption);
      fd.append("date", date);
      fd.append("location", location);
      const res = await fetch(`/api/tree/${treeId}/photos`, { method: "POST", body: fd });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "تصویر اپ لوڈ نہیں ہوئی");
      toast.success(j?.message || "تصویر محفوظ ہو گئی");
      setCaption("");
      setDate("");
      setLocation("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setUploading(false);
    }
  };

  const onImageClick = (e: React.MouseEvent<HTMLImageElement>, photo: PhotoDto) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTagging({ photoId: photo.id, x, y });
    setTagMemberId("");
  };

  const saveTag = async () => {
    if (!tagging || !tagMemberId) {
      toast.error("ممبر منتخب کریں");
      return;
    }
    try {
      const res = await fetch(`/api/tree/${treeId}/photos/${tagging.photoId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: tagMemberId, x: tagging.x, y: tagging.y }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ٹیگ نہیں لگا");
      toast.success("ٹیگ لگ گیا");
      setTagging(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    }
  };

  const removeTag = async (photoId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/tree/${treeId}/photos/${photoId}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "ٹیگ نہیں ہٹا");
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      const res = await fetch(`/api/tree/${treeId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: removing.id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "تصویر نہیں ہٹی");
      toast.success(j?.message || "تصویر ہٹا دی گئی");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-gray-50 p-3">
        <p className="mb-2 text-sm font-semibold text-gray-700">نئی خاندانی تصویر — Group Photo</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="کیپشن (اختیاری)" className="h-9 bg-white" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <Input type="date" className="h-9 bg-white" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input placeholder="مقام (اختیاری)" className="h-9 bg-white" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" className="h-8 bg-emerald-600" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1 h-3.5 w-3.5" />}
            تصویر منتخب کریں (max 8MB)
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <p className="py-4 text-center text-sm text-red-600">{error}</p>
      ) : photos.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Koi data nahi mila — پہلی خاندانی تصویر اپ لوڈ کریں
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border bg-white">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizeImageUrl(p.url)}
                  alt={p.caption ?? "خاندانی تصویر (Family Photo)"}
                  loading="lazy"
                  className="h-44 w-full cursor-crosshair object-cover"
                  onClick={(e) => onImageClick(e, p)}
                />
                {p.tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    title={`${t.member.firstName} ${t.member.lastName} (ہٹانے کے لیے کلک)`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
                    style={{ left: `${t.x * 100}%`, top: `${t.y * 100}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(p.id, t.memberId);
                    }}
                  >
                    {t.member.firstName} ✕
                  </button>
                ))}
                {tagging?.photoId === p.id && (
                  <div
                    className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white bg-black/30"
                    style={{ left: `${tagging.x * 100}%`, top: `${tagging.y * 100}%` }}
                  />
                )}
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-red-600"
                  onClick={() => setRemoving(p)}
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-800">{p.caption ?? "خاندانی تصویر"}</p>
                <p className="text-xs text-gray-400">
                  {p.date ? new Date(p.date).toLocaleDateString("en-GB") + " · " : ""}
                  {p.location ?? ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tagging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setTagging(null)}>
          <div className="w-72 rounded-xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">اس شخص کو ٹیگ کریں</p>
              <button type="button" onClick={() => setTagging(null)} aria-label="Close">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <Select value={tagMemberId} onValueChange={setTagMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="ممبر منتخب کریں" />
              </SelectTrigger>
              <SelectContent>
                {memberIds.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="mt-3 w-full bg-emerald-600" onClick={saveTag}>
              ٹیگ محفوظ کریں
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={Boolean(removing)} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تصویر ڈیلیٹ کریں؟</AlertDialogTitle>
            <AlertDialogDescription>یہ تصویر اور اس کے تمام ٹیگز ہٹ جائیں گے۔</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>منسوخ</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={(e) => { e.preventDefault(); confirmRemove(); }}>
              جی ہاں، ڈیلیٹ کریں
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
