"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseCsv } from "@/lib/csv-parser";
import type { CsvMemberField } from "@/lib/csv-parser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================
// IMPORT MODAL — GEDCOM/CSV upload with column mapping preview
// for CSV, duplicate-resolution report after import.
// ============================================================

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  onImported: () => void;
}

const CSV_FIELDS: { key: CsvMemberField; label: string }[] = [
  { key: "firstName", label: "پہلا نام *" },
  { key: "lastName", label: "خاندانی نام" },
  { key: "nickName", label: "عرفیت" },
  { key: "gender", label: "جنس (M/F)" },
  { key: "dateOfBirth", label: "تاریخ پیدائش" },
  { key: "dateOfDeath", label: "تاریخ وفات" },
  { key: "isAlive", label: "زندہ؟" },
  { key: "birthPlace", label: "جائے پیدائش" },
  { key: "deathPlace", label: "جائے وفات" },
  { key: "currentCity", label: "شہر" },
  { key: "occupation", label: "پیشہ" },
  { key: "education", label: "تعلیم" },
  { key: "bio", label: "تعارف" },
  { key: "phone", label: "فون" },
  { key: "email", label: "ای میل" },
  { key: "fatherName", label: "والد کا نام" },
  { key: "motherName", label: "والدہ کا نام" },
  { key: "spouseName", label: "شریک حیات کا نام" },
];

interface ImportResult {
  created: number;
  skipped: number;
  relationships: number;
  marriages: number;
  warnings: string[];
}

export function ImportModal({ open, onOpenChange, treeId, onImported }: ImportModalProps) {
  const [format, setFormat] = useState<"gedcom" | "csv">("gedcom");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setFileName(null);
    setCsvHeaders([]);
    setMapping({});
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = (f: File | null) => {
    reset();
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    if (format === "csv") {
      f.text().then((text) => {
        const parsed = parseCsv(text);
        setCsvHeaders(parsed.headers);
        const m: Record<string, string> = {};
        for (const [h, field] of Object.entries(parsed.autoMap)) m[h] = field;
        setMapping(m);
      });
    }
  };

  const submit = async () => {
    if (!file) {
      toast.error("فائل منتخب کریں");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("treeId", treeId);
      fd.append("format", format);
      if (format === "csv") fd.append("mapping", JSON.stringify(mapping));
      fd.append("file", file);
      const res = await fetch("/api/tree/import", { method: "POST", body: fd });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "امپورٹ نہیں ہوا");
      setResult({
        created: j.created ?? 0,
        skipped: j.skipped ?? 0,
        relationships: j.relationships ?? 0,
        marriages: j.marriages ?? 0,
        warnings: j.warnings ?? [],
      });
      toast.success(j?.message || "امپورٹ مکمل ہو گیا");
      onImported();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>شجرہ امپورٹ کریں — Import</DialogTitle>
          <DialogDescription>GEDCOM 5.5.1 یا CSV فائل سے ممبرز شامل کریں (زیادہ سے زیادہ 2MB)</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 rounded-xl border bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">امپورٹ مکمل ✓</p>
            <ul className="space-y-1 text-sm text-emerald-700">
              <li>نئے ممبرز: {result.created}</li>
              <li>چھوڑے گئے (ڈپلیکیٹ): {result.skipped}</li>
              <li>نئے رشتے: {result.relationships}</li>
              <li>نئی شادیاں: {result.marriages}</li>
            </ul>
            {result.warnings.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-white p-2 text-xs text-amber-700">
                {result.warnings.map((w, i) => (
                  <p key={i}>⚠️ {w}</p>
                ))}
              </div>
            )}
            <Button size="sm" onClick={reset}>
              نئی فائل امپورٹ کریں
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>فارمیٹ</Label>
              <Select
                value={format}
                onValueChange={(v) => {
                  setFormat(v as "gedcom" | "csv");
                  reset();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gedcom">GEDCOM (.ged) — 5.5.1</SelectItem>
                  <SelectItem value="csv">CSV (.csv) — کالم میپنگ کے ساتھ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <FileUp className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm font-medium text-gray-700">
                {fileName ?? "فائل یہاں چھوڑیں یا کلک کریں"}
              </span>
              <span className="mt-1 text-xs text-gray-400">
                {format === "gedcom" ? ".ged / .gedcom / .txt" : ".csv / .txt"} — max 2MB
              </span>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={format === "gedcom" ? ".ged,.gedcom,.txt" : ".csv,.txt"}
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {format === "csv" && csvHeaders.length > 0 && (
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-sm font-semibold text-gray-700">کالم میپنگ — Column Mapping</p>
                {csvHeaders.map((h) => (
                  <div key={h} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-600">{h}</span>
                    <Select
                      value={mapping[h] ?? ""}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v }))}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        {CSV_FIELDS.map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                منسوخ
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={uploading || !file} onClick={submit}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? "امپورٹ ہو رہا ہے..." : "امپورٹ کریں"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
