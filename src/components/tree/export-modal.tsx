"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileImage, FileJson, FileText, Loader2, TreePine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ============================================================
// EXPORT MODAL — format selection + download (GEDCOM/JSON/PDF/PNG).
// ============================================================

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
}

type ExportFormat = "gedcom" | "json" | "pdf" | "png";

const FORMATS: { id: ExportFormat; label: string; desc: string; icon: typeof FileText }[] = [
  { id: "gedcom", label: "GEDCOM 5.5.1", desc: "دوسرے جینالوجی سافٹ ویئر کے لیے (.ged)", icon: FileText },
  { id: "json", label: "JSON", desc: "مکمل ڈیٹا بیک اپ (.json)", icon: FileJson },
  { id: "pdf", label: "PDF", desc: "پرنٹ کے لیے درخت کا خاکہ (.pdf)", icon: FileText },
  { id: "png", label: "PNG", desc: "تصویری خاکہ شیئر کرنے کے لیے (.png)", icon: FileImage },
];

export function ExportModal({ open, onOpenChange, treeId }: ExportModalProps) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const download = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const res = await fetch(`/api/tree/export/${treeId}?format=${format}`);
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "ڈاؤن لوڈ نہیں ہوا");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? decodeURIComponent(match[1]) : `family-tree.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("فائل ڈاؤن لوڈ ہو گئی");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>شجرہ ایکسپورٹ کریں — Export</DialogTitle>
          <DialogDescription>فارمیٹ منتخب کریں — فائل فوراً ڈاؤن لوڈ ہو گی</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={busy !== null}
              onClick={() => download(f.id)}
              className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                {busy === f.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <f.icon className="h-5 w-5" />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-gray-800">{f.label}</span>
                <span className="block text-xs text-gray-500">{f.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="flex items-center gap-1.5 border-t pt-2 text-xs text-gray-400">
          <TreePine className="h-3.5 w-3.5" />
          ایکسپورٹ کی اجازت درخت کی رازداری کی ترتیبات میں دی جا سکتی ہے
        </p>
      </DialogContent>
    </Dialog>
  );
}
