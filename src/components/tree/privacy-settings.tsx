"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

// ============================================================
// PRIVACY SETTINGS — tree-level toggles + member-level toggles
// (hidden / hide photo / hide dates / hide bio / hide contact).
// ============================================================

interface PrivacySettingsProps {
  treeId: string;
}

interface MemberPrivacyRow {
  id: string;
  memberId: string;
  isHidden: boolean;
  hidePhoto: boolean;
  hideDates: boolean;
  hideBio: boolean;
  hideContact: boolean;
  member: { id: string; firstName: string; lastName: string };
}

interface PrivacyData {
  canEdit: boolean;
  privacy: {
    showLiving: boolean;
    showFemales: boolean;
    showPhotos: boolean;
    showDates: boolean;
    showPlaces: boolean;
    showOccupation: boolean;
    showBio: boolean;
    showContact: boolean;
    watermarkPhotos: boolean;
    allowDownload: boolean;
    allowExport: boolean;
  } | null;
  memberPrivacies: MemberPrivacyRow[];
  members: { id: string; firstName: string; lastName: string; isPrivate: boolean }[];
}

const DEFAULT_PRIVACY = {
  showLiving: true,
  showFemales: true,
  showPhotos: true,
  showDates: true,
  showPlaces: true,
  showOccupation: true,
  showBio: true,
  showContact: false,
  watermarkPhotos: true,
  allowDownload: false,
  allowExport: false,
};

const FIELD_LABELS: { key: keyof typeof DEFAULT_PRIVACY; label: string }[] = [
  { key: "showLiving", label: "زندہ افراد دکھائیں" },
  { key: "showFemales", label: "خواتین دکھائیں" },
  { key: "showPhotos", label: "تصاویر دکھائیں" },
  { key: "showDates", label: "تاریخیں دکھائیں" },
  { key: "showPlaces", label: "مقامات دکھائیں" },
  { key: "showOccupation", label: "پیشہ دکھائیں" },
  { key: "showBio", label: "تعارف دکھائیں" },
  { key: "showContact", label: "رابطہ دکھائیں" },
  { key: "watermarkPhotos", label: "تصاویر پر واٹر مارک" },
  { key: "allowDownload", label: "ڈاؤن لوڈ کی اجازت" },
  { key: "allowExport", label: "ایکسپورٹ کی اجازت" },
];

export function PrivacySettings({ treeId }: PrivacySettingsProps) {
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTree, setSavingTree] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/privacy`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "ترتیبات لوڈ نہیں ہوئیں");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    load();
  }, [load]);

  const patchTree = (key: keyof typeof DEFAULT_PRIVACY, value: boolean) => {
    if (!data) return;
    const privacy = { ...(data.privacy ?? DEFAULT_PRIVACY), [key]: value };
    setData({ ...data, privacy });
    saveTree({ [key]: value });
  };

  const saveTree = async (patch: Partial<typeof DEFAULT_PRIVACY>) => {
    setSavingTree(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/privacy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "محفوظ نہیں ہوئیں");
      toast.success(j?.message || "ترتیبات محفوظ ہو گئیں");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSavingTree(false);
    }
  };

  const memberRow = (memberId: string): MemberPrivacyRow => {
    const existing = data?.memberPrivacies.find((r) => r.memberId === memberId);
    return (
      existing ?? {
        id: "",
        memberId,
        isHidden: false,
        hidePhoto: false,
        hideDates: false,
        hideBio: false,
        hideContact: true,
        member: data?.members.find((m) => m.id === memberId) as MemberPrivacyRow["member"],
      }
    );
  };

  const patchMember = (memberId: string, key: keyof Omit<MemberPrivacyRow, "id" | "memberId" | "member">, value: boolean) => {
    if (!data) return;
    const row = memberRow(memberId);
    const updated: MemberPrivacyRow = { ...row, [key]: value };
    setData({
      ...data,
      memberPrivacies: [
        ...data.memberPrivacies.filter((r) => r.memberId !== memberId),
        updated,
      ],
    });
    saveMember(memberId, { [key]: value });
  };

  const saveMember = async (memberId: string, patch: Record<string, boolean>) => {
    setSavingMemberId(memberId);
    try {
      const res = await fetch(`/api/tree/${treeId}/privacy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, ...patch }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "محفوظ نہیں ہوئی");
      toast.success(j?.message || "ممبر کی رازداری محفوظ ہو گئی");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSavingMemberId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error ?? "ترتیبات لوڈ نہیں ہوئیں"}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={load}>
          دوبارہ کوشش کریں
        </Button>
      </div>
    );
  }

  const privacy = { ...DEFAULT_PRIVACY, ...(data.privacy ?? {}) };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">درخت کی رازداری — Tree Privacy</h3>
          {savingTree && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
        </div>
        <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {FIELD_LABELS.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-2 text-sm text-gray-700">
              {f.label}
              <Switch
                checked={privacy[f.key]}
                disabled={!data.canEdit}
                onCheckedChange={(v) => patchTree(f.key, v)}
              />
            </label>
          ))}
        </div>
        {!data.canEdit && (
          <p className="mt-2 text-xs text-amber-600">صرف مالک یا ایڈمن یہ ترتیبات بدل سکتے ہیں</p>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-800">ممبرز کی رازداری — Member Privacy</h3>
        {data.members.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Koi data nahi mila — کوئی ممبر نہیں</p>
        ) : (
          <div className="space-y-2">
            {data.members.map((m) => {
              const row = memberRow(m.id);
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-gray-50 p-2.5">
                  <span className="w-36 truncate text-sm font-medium text-gray-800">
                    {m.firstName} {m.lastName}
                  </span>
                  <MemberToggle
                    label="چھپائیں"
                    checked={row.isHidden}
                    disabled={!data.canEdit || savingMemberId === m.id}
                    onChange={(v) => patchMember(m.id, "isHidden", v)}
                  />
                  <MemberToggle
                    label="تصویر"
                    checked={row.hidePhoto}
                    disabled={!data.canEdit || savingMemberId === m.id}
                    onChange={(v) => patchMember(m.id, "hidePhoto", v)}
                  />
                  <MemberToggle
                    label="تاریخیں"
                    checked={row.hideDates}
                    disabled={!data.canEdit || savingMemberId === m.id}
                    onChange={(v) => patchMember(m.id, "hideDates", v)}
                  />
                  <MemberToggle
                    label="تعارف"
                    checked={row.hideBio}
                    disabled={!data.canEdit || savingMemberId === m.id}
                    onChange={(v) => patchMember(m.id, "hideBio", v)}
                  />
                  <MemberToggle
                    label="رابطہ"
                    checked={row.hideContact}
                    disabled={!data.canEdit || savingMemberId === m.id}
                    onChange={(v) => patchMember(m.id, "hideContact", v)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Save className="h-3.5 w-3.5" />
        ہر تبدیلی خودکار طور پر محفوظ ہو جاتی ہے
      </div>
    </div>
  );
}

function MemberToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-600">
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} className="scale-75" />
      {label}
    </label>
  );
}
