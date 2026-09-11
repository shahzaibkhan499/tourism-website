"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECTIONS = [
  { key: "profile", label: "Profile", urdu: "پروفائل" },
  { key: "birth", label: "Birth", urdu: "پیدائش" },
  { key: "family", label: "Family Member", urdu: "خاندانی ممبر" },
  { key: "relations", label: "Family Relation", urdu: "خاندانی رشتے" },
  { key: "death", label: "Death", urdu: "وفات" },
  { key: "occupation", label: "Occupation", urdu: "روزگار" },
  { key: "contact", label: "Contact", urdu: "رابطہ" },
  { key: "education", label: "Education", urdu: "تعلیم" },
  { key: "experience", label: "Experience", urdu: "تجربہ" },
  { key: "favorites", label: "Favorites", urdu: "پسندیدہ" },
  { key: "personal", label: "Personal Info", urdu: "ذاتی معلومات" },
];

const OPTIONS = [
  { value: "public", label: "پبلک — سب دیکھ سکتے ہیں" },
  { value: "clan", label: "صرف کلان — صرف آپ کی کلان" },
  { value: "private", label: "پرائیویٹ — صرف آپ" },
];

export function PrivacyTab() {
  const [privacy, setPrivacy] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const p = json?.privacy ?? {};
        setPrivacy(Object.fromEntries(SECTIONS.map((s) => [s.key, p[s.key] ?? "public"])));
      })
      .catch(() =>
        setPrivacy(Object.fromEntries(SECTIONS.map((s) => [s.key, "public"])))
      );
  }, []);

  const set = (key: string, value: string) => {
    setPrivacy((s) => (s ? { ...s, [key]: value } : s));
  };

  const save = async () => {
    if (!privacy) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(privacy),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "کچھ غلط ہو گیا");
      toast.success("پرائیویسی ترتیبات محفوظ ہو گئیں!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  if (privacy === null) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Visibility — پروفائل کی پرائیویسی</CardTitle>
          <CardDescription>
            ہر سیکشن کے لیے طے کریں کہ کون دیکھ سکتا ہے۔ اہم تفصیلات (نام، جنس، شہر) ہمیشہ پوچھی جاتی ہیں، صرف ان کا
            ظاہر ہونا یہاں سے کنٹرول ہوتا ہے۔
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div dir="rtl" className="font-urdu text-xs text-emerald-700">{s.urdu}</div>
              </div>
              <Select value={privacy[s.key] ?? "public"} onValueChange={(v) => set(s.key, v)}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? "محفوظ ہو رہا ہے..." : "پرائیویسی محفوظ کریں"}
        </Button>
      </div>
    </div>
  );
}
