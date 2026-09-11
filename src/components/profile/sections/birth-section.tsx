"use client";

import { useEffect, useState } from "react";
import { Baby } from "lucide-react";
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

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B", "B+", "B-", "AB", "AB+", "AB-", "Unknown"];

export function BirthSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        gender: profile?.gender ?? "",
        bloodGroup: profile?.bloodGroup ?? "",
        dateOfBirth: profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "",
        birthPlace: profile?.birthPlace ?? "",
        cnic: profile?.cnic ?? "",
      });
    }
  }, [open, profile]);

  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: form.gender || null,
          bloodGroup: form.bloodGroup || null,
          dateOfBirth: form.dateOfBirth || null,
          birthPlace: form.birthPlace || null,
          cnic: form.cnic || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "کچھ غلط ہو گیا");
      toast.success("پیدائش کی معلومات محفوظ ہو گئیں!");
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  const summary = [
    profile?.gender ? (profile.gender === "MALE" ? "مرد" : profile.gender === "FEMALE" ? "عورت" : "دیگر") : null,
    profile?.bloodGroup,
    profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : null,
    profile?.birthPlace,
    profile?.cnic ? `CNIC: ${profile.cnic}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SectionCard
        icon={Baby}
        title="Birth"
        titleUrdu="پیدائش"
        description="جنس، بلڈ گروپ، تاریخ پیدائش، CNIC"
        summary={summary || undefined}
        onEdit={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span>Birth Details</span>
              <span dir="rtl" className="font-urdu text-lg text-emerald-700">پیدائش کی تفصیلات</span>
            </DialogTitle>
            <DialogDescription>پیدائش سے متعلق معلومات</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Gender — جنس</Label>
              <Select value={form.gender ?? "all"} onValueChange={(v) => set("gender", v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">منتخب کریں</SelectItem>
                  <SelectItem value="MALE">Male — مرد</SelectItem>
                  <SelectItem value="FEMALE">Female — عورت</SelectItem>
                  <SelectItem value="OTHER">Other — دیگر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Blood Type — بلڈ گروپ</Label>
              <Select value={form.bloodGroup ?? "all"} onValueChange={(v) => set("bloodGroup", v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">منتخب کریں</SelectItem>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth — تاریخ پیدائش</Label>
              <Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Place of Birth — جائے پیدائش</Label>
              <Input value={form.birthPlace ?? ""} onChange={(e) => set("birthPlace", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>CNIC No — شناختی کارڈ نمبر</Label>
              <Input value={form.cnic ?? ""} onChange={(e) => set("cnic", e.target.value)} placeholder="42101-1234567-8" />
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
