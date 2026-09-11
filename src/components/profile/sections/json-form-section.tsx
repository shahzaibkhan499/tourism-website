"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface JsonField {
  name: string; // supports nesting with dots, e.g. "residence.mohalla"
  label: string;
  urdu: string;
  type?: "text" | "date" | "textarea" | "switch";
  options?: string[];
  placeholder?: string;
}

interface JsonFormSectionProps {
  id?: string;
  icon: LucideIcon;
  iconClass?: string;
  title: string;
  titleUrdu: string;
  description?: string;
  sectionKey: string;
  fields: JsonField[];
  summaryKeys?: string[];
  profile: any;
  onSaved: () => void;
}

function getNested(obj: any, path: string): string {
  if (!obj) return "";
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    cur = cur?.[p];
    if (cur == null) return "";
  }
  return typeof cur === "string" ? cur : cur ? String(cur) : "";
}

function setNested(obj: Record<string, any>, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== "object" || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value === "" ? null : value;
}

export function JsonFormSection({
  id,
  icon,
  iconClass,
  title,
  titleUrdu,
  description,
  sectionKey,
  fields,
  summaryKeys,
  profile,
  onSaved,
}: JsonFormSectionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const data = profile?.extendedProfile?.[sectionKey] ?? {};

  useEffect(() => {
    if (open) {
      const init: Record<string, string | boolean> = {};
      for (const f of fields) {
        init[f.name] = f.type === "switch" ? Boolean(getNested(data, f.name)) : getNested(data, f.name);
      }
      setForm(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: string, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        setNested(payload, f.name, f.type === "switch" ? Boolean(form[f.name]) : (form[f.name] as string));
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extendedProfile: { [sectionKey]: payload } }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "کچھ غلط ہو گیا");
      toast.success(`${titleUrdu} محفوظ ہو گئی!`);
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSaving(false);
    }
  };

  const summary = (summaryKeys ?? [])
    .map((k) => getNested(data, k))
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SectionCard
        id={id}
        icon={icon}
        iconClass={iconClass}
        title={title}
        titleUrdu={titleUrdu}
        description={description}
        summary={summary || undefined}
        onEdit={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span>{title}</span>
              <span dir="rtl" className="font-urdu text-lg text-emerald-700">{titleUrdu}</span>
            </DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={`space-y-2 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <Label className="flex flex-wrap items-baseline gap-x-2">
                  <span>{f.label}</span>
                  <span dir="rtl" className="font-urdu text-xs text-gray-500">{f.urdu}</span>
                </Label>
                {f.type === "switch" ? (
                  <div className="flex h-9 items-center gap-3">
                    <Switch
                      checked={Boolean(form[f.name])}
                      onCheckedChange={(v) => set(f.name, v)}
                    />
                    <span className="text-sm text-gray-600">{form[f.name] ? "آن" : "آف"}</span>
                  </div>
                ) : f.options ? (
                  <Select
                    value={String(form[f.name] ?? "all")}
                    onValueChange={(v) => set(f.name, v === "all" ? "" : v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">منتخب کریں</SelectItem>
                      {f.options.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea
                    rows={3}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                ) : (
                  <Input
                    type={f.type === "date" ? "date" : "text"}
                    value={String(form[f.name] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => set(f.name, e.target.value)}
                  />
                )}
              </div>
            ))}
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
