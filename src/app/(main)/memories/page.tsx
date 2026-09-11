"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, BookOpen, MapPin, Trash2, Sparkles, LayoutGrid, List } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/ui/pagination";
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
import { MEMORY_CATEGORIES, getMemoryCategoryInfo } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { MemoryItem } from "@/types";

export default function MemoriesPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [view, setView] = useState<"timeline" | "grid">("timeline");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [onThisDay, setOnThisDay] = useState<Array<{ id: string; title: string }>>([]);

  const fetchMemories = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "12" });
        if (category !== "all") params.set("category", category);
        if (visibility !== "all") params.set("visibility", visibility);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/memories?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "یادیں لوڈ نہیں ہو سکیں");
          return;
        }
        setMemories((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        setOnThisDay(data.onThisDay || []);
      } catch {
        toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
      } finally {
        setLoading(false);
      }
    },
    [category, visibility]
  );

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ڈیلیٹ نہیں ہو سکی");
        return;
      }
      toast.success("میموری ڈیلیٹ ہو گئی");
      fetchMemories();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <PageHeader
        title="Memories"
        titleUrdu="یادیں"
        description="اپنی یادیں محفوظ کریں"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/memories/create">
              <Plus className="mr-1 h-4 w-4" />
              نئی یاد بنائیں
            </Link>
          </Button>
        }
      />

      {/* On This Day */}
      {onThisDay.length > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
          <Sparkles className="h-6 w-6 shrink-0 text-amber-500" />
          <div>
            <div className="text-sm font-semibold text-amber-800">On This Day!</div>
            <p className="text-xs text-amber-700">
              {onThisDay.map((m) => m.title).join(" · ")} — آج کے دن یہ یادیں بنی تھیں
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام زمرے</SelectItem>
            {MEMORY_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.emoji} {c.label} — {c.labelUrdu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sab</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1 rounded-lg border p-1">
          <button
            onClick={() => setView("timeline")}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${view === "timeline" ? "bg-emerald-100 text-emerald-700" : "text-gray-400 hover:bg-gray-100"}`}
            aria-label="Timeline view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${view === "grid" ? "bg-emerald-100 text-emerald-700" : "text-gray-400 hover:bg-gray-100"}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && memories.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="کوئی ڈیٹا نہیں ملا"
          description="ابھی کوئی یاد نہیں ہے۔ اپنی پہلی یاد بنائیں!"
          actionLabel="یاد بنائیں"
          actionHref="/memories/create"
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {memories.flatMap((m) =>
            m.media
              .filter((med) => med.type === "IMAGE")
              .map((med) => (
                <Link key={med.id} href={`/memories`} className="group relative aspect-square overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={med.url}
                    alt={m.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs text-white line-clamp-2">{m.title}</span>
                  </div>
                </Link>
              ))
          )}
        </div>
      ) : (
        <>
          <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:h-full before:w-0.5 before:bg-emerald-100">
            {memories.map((memory) => {
              const info = getMemoryCategoryInfo(memory.category);
              return (
                <div key={memory.id} className="relative flex gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-white text-lg">
                    {info.emoji}
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{memory.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {memory.date && <span>{formatDate(memory.date)}</span>}
                            {memory.location && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {memory.location}
                              </span>
                            )}
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              {info.label} · {info.labelUrdu}
                            </Badge>
                            {memory.isPublic ? (
                              <Badge variant="info" className="px-1.5 py-0 text-[10px]">Public</Badge>
                            ) : (
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">Private</Badge>
                            )}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>میموری ڈیلیٹ کریں؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                یہ میموری اور اس کا سارا میڈیا ہمیشہ کے لیے ڈیلیٹ ہو جائے گا۔
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(memory.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      {memory.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{memory.description}</p>
                      )}
                      {memory.media.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                          {memory.media.slice(0, 5).map((m) =>
                            m.type === "IMAGE" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={m.id} src={m.url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <div key={m.id} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
                                {m.type === "VIDEO" ? "🎬" : m.type === "AUDIO" ? "🎵" : "📄"}
                              </div>
                            )
                          )}
                          {memory.media.length > 5 && (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
                              +{memory.media.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
          <Pagination
            hasMore={hasMore}
            isLoading={loading}
            onNext={() => nextCursor && fetchMemories(nextCursor, false)}
            onPrev={() => fetchMemories(undefined, true)}
          />
        </>
      )}
    </div>
  );
}
