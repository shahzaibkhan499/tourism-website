"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Camera, Upload, Trash2, Search, Download, Eye, LayoutGrid, List, HardDrive, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatBytes, formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { MediaItem } from "@/types";

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState("ALL");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [totalSize, setTotalSize] = useState(0);
  const [quotaGb, setQuotaGb] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "24" });
        if (type !== "ALL") params.set("type", type);
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/media?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Media load nahi ho saka");
          return;
        }
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        setTotalSize(data.totalSize);
        setQuotaGb(data.quotaGb);
      } catch {
        toast.error("Network error. Dobara koshish karein.");
      } finally {
        setLoading(false);
      }
    },
    [type, debouncedQuery]
  );

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

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
      toast.success("File upload ho gayi");
      fetchMedia();
    } catch {
      toast.error("Upload mein masla aa gaya");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      const res = await fetch(`/api/media?ids=${encodeURIComponent(ids.join(","))}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Delete nahi ho saka");
        return;
      }
      toast.success(data.message || "Delete ho gaya");
      setSelected(new Set());
      fetchMedia();
    } catch {
      toast.error("Network error");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const usagePercent = Math.min(100, (totalSize / (quotaGb * 1024 * 1024 * 1024)) * 100);

  const typeBadge = (t: string) =>
    t === "IMAGE" ? <Badge variant="info">Image</Badge> : t === "VIDEO" ? <Badge variant="purple">Video</Badge> : t === "AUDIO" ? <Badge variant="warning">Audio</Badge> : <Badge variant="secondary">Document</Badge>;

  return (
    <div>
      <PageHeader
        title="Media Library"
        titleUrdu="میڈیا"
        description="Aapki tamam files aik jagah"
        actions={
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            Upload Karein
          </Button>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />

      {/* Storage usage */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <HardDrive className="h-4 w-4 text-emerald-600" />
              Storage Usage
            </span>
            <span className="text-gray-500">
              {formatBytes(totalSize)} / {quotaGb} GB
            </span>
          </div>
          <Progress value={usagePercent} className="mt-2" />
        </CardContent>
      </Card>

      {/* Search + type filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Files search karein..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Sab Files</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="DOCUMENT">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3">
          <span className="text-sm font-medium text-red-700">{selected.size} file(s) selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{selected.size} file(s) delete karein?</AlertDialogTitle>
                  <AlertDialogDescription>Yeh action wapas nahi ho sakta.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(Array.from(selected))}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <Tabs value={type} onValueChange={(v) => setType(v)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="IMAGE">Photos</TabsTrigger>
            <TabsTrigger value="VIDEO">Videos</TabsTrigger>
            <TabsTrigger value="AUDIO">Audio</TabsTrigger>
            <TabsTrigger value="DOCUMENT">Documents</TabsTrigger>
          </TabsList>
          <div className="flex gap-1 rounded-lg border p-1">
            <button
              onClick={() => setView("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${view === "grid" ? "bg-emerald-100 text-emerald-700" : "text-gray-400 hover:bg-gray-100"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${view === "list" ? "bg-emerald-100 text-emerald-700" : "text-gray-400 hover:bg-gray-100"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <TabsContent value={type} className="mt-4">
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Camera className="h-12 w-12" />}
              title="Koi media nahi hai. Upload karein!"
              description="Apni photos, videos aur documents yahan mehfooz karein"
              actionLabel="Upload Karein"
              onAction={() => fileInputRef.current?.click()}
            />
          ) : view === "grid" ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {items.map((item) => (
                  <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl border bg-gray-50">
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-3xl">
                        {item.type === "VIDEO" ? "🎬" : item.type === "AUDIO" ? "🎵" : "📄"}
                        <span className="mt-1 text-[10px] text-gray-400">{formatBytes(item.size)}</span>
                      </div>
                    )}
                    <div className="absolute right-1.5 top-1.5">
                      <Checkbox
                        checked={selected.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="border-white bg-white/90"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="truncate text-[10px] text-white">{item.type}</span>
                      <div className="flex gap-1">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-300">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        <a href={item.url} download className="text-white hover:text-emerald-300">
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
                              <AlertDialogTitle>File delete karein?</AlertDialogTitle>
                              <AlertDialogDescription>Yeh action wapas nahi ho sakta.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete([item.id])}>
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
              <Pagination
                hasMore={hasMore}
                isLoading={loading}
                onNext={() => nextCursor && fetchMedia(nextCursor, false)}
                onPrev={() => fetchMedia(undefined, true)}
              />
            </>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-500">Name</th>
                    <th className="p-3 text-left font-medium text-gray-500">Type</th>
                    <th className="p-3 text-left font-medium text-gray-500">Size</th>
                    <th className="p-3 text-left font-medium text-gray-500">Date</th>
                    <th className="p-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                          <span className="truncate text-xs text-gray-600">{item.url.split("/").pop()}</span>
                        </div>
                      </td>
                      <td className="p-3">{typeBadge(item.type)}</td>
                      <td className="p-3 text-xs text-gray-500">{formatBytes(item.size)}</td>
                      <td className="p-3 text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600">
                            <Eye className="h-4 w-4" />
                          </a>
                          <a href={item.url} download className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-emerald-600">
                            <Download className="h-4 w-4" />
                          </a>
                          <button onClick={() => handleDelete([item.id])} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
