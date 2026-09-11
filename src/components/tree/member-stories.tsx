"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemberStoryDto } from "@/types/tree";

// ============================================================
// MEMBER STORIES — biographies/kahaniyan with add form.
// ============================================================

interface MemberStoriesProps {
  treeId: string;
  memberId: string;
}

export function MemberStories({ treeId, memberId }: MemberStoriesProps) {
  const [stories, setStories] = useState<MemberStoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", language: "ur", isPublic: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/stories/${memberId}`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "کہانیاں لوڈ نہیں ہوئیں");
      setStories(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [treeId, memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("عنوان اور کہانی دونوں لکھیں");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/stories/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "محفوظ نہیں ہوئی");
      toast.success(j?.message || "کہانی محفوظ ہو گئی");
      setForm({ title: "", content: "", language: "ur", isPublic: true });
      setFormOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={load}>
          دوبارہ کوشش کریں
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          کہانیاں ({stories.length})
        </span>
        <Button size="sm" variant="outline" className="h-8" onClick={() => setFormOpen(!formOpen)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          کہانی لکھیں
        </Button>
      </div>

      {formOpen && (
        <div className="mb-4 space-y-2.5 rounded-xl border bg-gray-50 p-3">
          <div className="space-y-1">
            <Label className="text-xs">عنوان *</Label>
            <Input className="h-9 bg-white" placeholder="مثلاً: دادا جان کی ہجرت کی کہانی" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">کہانی *</Label>
            <Textarea rows={4} className="bg-white" placeholder="پوری کہانی لکھیں..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              سب کو دکھائیں
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              زبان:
              <select
                className="rounded border bg-white px-1 py-0.5 text-xs"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="ur">اردو</option>
                <option value="en">English</option>
                <option value="pn">پنجابی</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setFormOpen(false)}>
              منسوخ
            </Button>
            <Button size="sm" className="h-8 bg-emerald-600" disabled={saving} onClick={submit}>
              {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              محفوظ کریں
            </Button>
          </div>
        </div>
      )}

      {stories.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila — پہلی کہانی لکھیں</p>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => (
            <article key={s.id} className="rounded-xl border bg-white p-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-semibold text-gray-800">{s.title}</h4>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{s.content}</p>
              <div className="mt-2 text-xs text-gray-400">
                {s.author?.name ?? "ممبر"} ·{" "}
                {new Date(s.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                {" · "}
                {s.language === "ur" ? "اردو" : s.language === "en" ? "English" : "پنجابی"}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
