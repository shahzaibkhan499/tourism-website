"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIFETIME_EVENT_META } from "@/lib/tree-utils";
import type { LifeEventType, MemberLifeEventDto } from "@/types/tree";

// ============================================================
// MEMBER TIMELINE — vertical life-event timeline with add form.
// ============================================================

interface MemberTimelineProps {
  treeId: string;
  memberId: string;
}

const EVENT_TYPES = Object.keys(LIFETIME_EVENT_META) as LifeEventType[];

export function MemberTimeline({ treeId, memberId }: MemberTimelineProps) {
  const [events, setEvents] = useState<MemberLifeEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "BIRTH" as LifeEventType,
    title: "",
    date: "",
    location: "",
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/timeline/${memberId}`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ٹائم لائن لوڈ نہیں ہوئی");
      setEvents(j.items ?? []);
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
    if (!form.title.trim() || !form.date) {
      toast.error("عنوان اور تاریخ لکھیں");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/timeline/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          date: new Date(form.date).toISOString(),
          location: form.location || null,
          description: form.description || null,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "محفوظ نہیں ہوا");
      toast.success(j?.message || "واقعہ شامل ہو گیا");
      setForm({ type: "BIRTH", title: "", date: "", location: "", description: "" });
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
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
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
          زندگی کے واقعات ({events.length})
        </span>
        <Button size="sm" variant="outline" className="h-8" onClick={() => setFormOpen(!formOpen)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          واقعہ شامل کریں
        </Button>
      </div>

      {formOpen && (
        <div className="mb-4 space-y-2.5 rounded-xl border bg-gray-50 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">قسم — Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as LifeEventType })}>
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LIFETIME_EVENT_META[t].emoji} {LIFETIME_EVENT_META[t].label} — {LIFETIME_EVENT_META[t].urdu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">تاریخ *</Label>
              <Input type="date" className="h-9 bg-white" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">عنوان *</Label>
            <Input className="h-9 bg-white" placeholder="مثلاً: عقیقہ کی تقریب" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">مقام — Location</Label>
            <Input className="h-9 bg-white" placeholder="مثلاً: لاہور" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">تفصیل</Label>
            <Textarea rows={2} className="bg-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila — پہلا واقعہ شامل کریں</p>
      ) : (
        <div className="relative ml-2 space-y-4 border-l-2 border-emerald-100 pl-4">
          {events.map((e) => {
            const meta = LIFETIME_EVENT_META[e.type] ?? LIFETIME_EVENT_META.OTHER;
            return (
              <div key={e.id} className="relative">
                <span className="absolute -left-[25px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px]">
                  {meta.emoji}
                </span>
                <div className="text-sm font-semibold text-gray-800">
                  {meta.urdu} · {e.title}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                  {e.location ? ` · ${e.location}` : ""}
                </div>
                {e.description && <p className="mt-1 text-xs text-gray-600">{e.description}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
