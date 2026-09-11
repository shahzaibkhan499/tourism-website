"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Trash2, Eye, Download, HardDrive, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { formatBytes, formatDate } from "@/lib/utils";

interface AdminMedia {
  id: string;
  url: string;
  type: string;
  size: number | null;
  mimeType: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface MediaData {
  media: AdminMedia[];
  totalSize: number;
  typeCounts: Record<string, number>;
}

export default function AdminMediaPage() {
  const [data, setData] = useState<MediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      const res = await fetch(`/api/admin/media?${params}`);
      const json = await res.json();
      if (!res.ok) return toast.error(json.error || "میڈیا لوڈ نہیں ہو سکا");
      setData(json);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = async (ids: string[]) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media?ids=${encodeURIComponent(ids.join(","))}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) return toast.error(json.error || "ڈیلیٹ نہیں ہو سکا");
      toast.success(json.message || "ڈیلیٹ ہو گیا");
      fetchMedia();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const typeBadge = (t: string) =>
    t === "IMAGE" ? <Badge variant="info">Image</Badge> : t === "VIDEO" ? <Badge variant="purple">Video</Badge> : t === "AUDIO" ? <Badge variant="warning">Audio</Badge> : <Badge variant="secondary">Document</Badge>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="text-sm text-gray-500">پلیٹ فارم کی تمام اپ لوڈ شدہ فائلیں</p>
      </div>

      {/* Storage stats */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <HardDrive className="h-4 w-4 text-emerald-600" /> Total Storage
              </div>
              <div className="mt-1 text-2xl font-bold">{data ? formatBytes(data.totalSize) : "—"}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Images</div>
              <div className="mt-1 text-2xl font-bold">{data?.typeCounts?.IMAGE ?? 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Videos</div>
              <div className="mt-1 text-2xl font-bold">{data?.typeCounts?.VIDEO ?? 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Documents & Audio</div>
              <div className="mt-1 text-2xl font-bold">
                {(data?.typeCounts?.DOCUMENT ?? 0) + (data?.typeCounts?.AUDIO ?? 0)}
              </div>
            </div>
          </div>
          <Progress
            value={data ? Math.min(100, (data.totalSize / (100 * 1024 * 1024 * 1024)) * 100) : 0}
            className="mt-4"
          />
          <p className="mt-1 text-xs text-gray-400">Platform storage (per 100 GB scale)</p>
        </CardContent>
      </Card>

      <div className="mb-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام اقسام</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="DOCUMENT">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : data?.media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">کوئی میڈیا نہیں ہے</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {data?.media.map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-gray-50">
              <div className="absolute left-1.5 top-1.5 z-10">{typeBadge(m.type)}</div>
              {m.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-3xl">
                  {m.type === "VIDEO" ? "🎬" : m.type === "AUDIO" ? "🎵" : "📄"}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate text-[10px] text-white">
                  {m.user?.name || "Unknown"} · {formatBytes(m.size)}
                </span>
                <div className="flex gap-1">
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-300">
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <a href={m.url} download className="text-white hover:text-emerald-300">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-white hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>فائل ڈیلیٹ کریں؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          {m.user?.name || "User"} کی فائل ({formatDate(m.createdAt)}) ڈیلیٹ ہو جائے گی۔
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleting}
                          onClick={() => handleDelete([m.id])}
                        >
                          {deleting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
