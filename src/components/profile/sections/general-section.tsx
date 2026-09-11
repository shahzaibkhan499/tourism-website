"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "./section-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TITLES = ["Hafiz", "Dr", "Prof", "Mr", "Ms", "Mrs", "Miss"];
const SUFFIXES = ["B.Sc.", "Eng", "II", "III", "Jr", "MA", "MD", "Ph.D."];
const MARITAL = [
  { value: "SINGLE", label: "Single — غیر شادی شدہ" },
  { value: "MARRIED", label: "Married — شادی شدہ" },
  { value: "DIVORCED", label: "Divorce — طلاق یافتہ" },
  { value: "WIDOW", label: "Widow — بیوہ / بیوے" },
];

export function GeneralSection({
  profile,
  onSaved,
}: {
  profile: any;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const names = profile?.extendedProfile?.names ?? {};
      setForm({
        nameTitle: profile?.nameTitle ?? "",
        firstName: names.first ?? "",
        middleName: names.middle ?? "",
        familyName: names.family ?? "",
        nickname: profile?.nickname ?? "",
        suffix: names.suffix ?? "",
        displayName: profile?.displayName ?? "",
        cast: profile?.cast ?? "",
        origin: profile?.origin ?? "",
        city: profile?.city ?? "",
        maritalStatus: profile?.maritalStatus ?? "SINGLE",
      });
    }
  }, [open, profile]);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const parts = [form.firstName, form.middleName, form.familyName].filter(Boolean);
      const body: any = {
        nameTitle: form.nameTitle || null,
        nickname: form.nickname || null,
        displayName: form.displayName || null,
        cast: form.cast || null,
        origin: form.origin || null,
        city: form.city || null,
        maritalStatus: form.maritalStatus || "SINGLE",
        extendedProfile: {
          names: {
            first: form.firstName || null,
            middle: form.middleName || null,
            family: form.familyName || null,
            suffix: form.suffix || null,
          },
        },
      };
      if (parts.length > 0) body.name = parts.join(" ");
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "کچھ غلط ہو گیا");
      toast.success("عمومی معلومات محفوظ ہو گئیں!");
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  const summary = [
    profile?.nameTitle,
    profile?.displayName ?? profile?.nickname,
    profile?.cast,
    profile?.origin,
    profile?.city,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SectionCard
        icon={UserRound}
        title="General"
        titleUrdu="عمومی معلومات"
        description="نا، خطاب، ذات، اصل، موجودہ شہر"
        summary={summary || undefined}
        onEdit={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span>General Information</span>
              <span dir="rtl" className="font-urdu text-lg text-emerald-700">عمومی معلومات</span>
            </DialogTitle>
            <DialogDescription>Part I — بنیادی اور ذاتی تفصیلات</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title — خطاب</Label>
              <Select value={form.nameTitle ?? "all"} onValueChange={(v) => set("nameTitle", v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">کوئی نہیں</SelectItem>
                  {TITLES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>First Name — پہلا نام</Label>
              <Input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Middle Name — درمیانی نام</Label>
              <Input value={form.middleName ?? ""} onChange={(e) => set("middleName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Family Name / Surname — خاندانی نام</Label>
              <Input value={form.familyName ?? ""} onChange={(e) => set("familyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nick Name — عرفیت</Label>
              <Input value={form.nickname ?? ""} onChange={(e) => set("nickname", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Suffix — سابقہ/لاحقہ</Label>
              <Select value={form.suffix ?? "all"} onValueChange={(v) => set("suffix", v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">کوئی نہیں</SelectItem>
                  {SUFFIXES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Display Name — ظاہری نام</Label>
              <Input value={form.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cast — ذات</Label>
              <Input value={form.cast ?? ""} onChange={(e) => set("cast", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Origin — اصل</Label>
              <Input value={form.origin ?? ""} onChange={(e) => set("origin", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Current City — موجودہ شہر</Label>
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Marital Status — ازدواجی حیثیت</Label>
              <Select value={form.maritalStatus ?? "SINGLE"} onValueChange={(v) => set("maritalStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARITAL.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>منسوخ</Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              محفوظ کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
