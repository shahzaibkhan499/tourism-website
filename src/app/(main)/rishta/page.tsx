"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Heart, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
import { RishtaCard } from "@/components/rishta/rishta-card";
import { RequestsInbox } from "@/components/rishta/requests-inbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { EDUCATION_LEVELS, SECTS, MARITAL_STATUSES } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import type { RishtaProfileItem } from "@/types";

export default function RishtaPage() {
  const [profiles, setProfiles] = useState<RishtaProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [gender, setGender] = useState("all");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [education, setEducation] = useState("all");
  const [profession, setProfession] = useState("");
  const [sect, setSect] = useState("all");
  const [city, setCity] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("all");
  const [caste, setCaste] = useState("");
  const debouncedProfession = useDebounce(profession);
  const debouncedCaste = useDebounce(caste);

  const fetchProfiles = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "12" });
        if (gender !== "all") params.set("gender", gender);
        if (minAge) params.set("minAge", minAge);
        if (maxAge) params.set("maxAge", maxAge);
        if (education !== "all") params.set("education", education);
        if (debouncedProfession) params.set("profession", debouncedProfession);
        if (sect !== "all") params.set("sect", sect);
        if (city) params.set("city", city);
        if (maritalStatus !== "all") params.set("maritalStatus", maritalStatus);
        if (debouncedCaste) params.set("caste", debouncedCaste);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/rishta?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "پروفائلز لوڈ نہیں ہو سکیں");
          return;
        }
        setProfiles((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
      } finally {
        setLoading(false);
      }
    },
    [gender, minAge, maxAge, education, debouncedProfession, sect, city, maritalStatus, debouncedCaste]
  );

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const activeFilterCount = [gender, minAge, maxAge, education, sect, city, maritalStatus].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Rishta"
        titleUrdu="رشتہ"
        description="احترام اور حفاظت کے ساتھ رشتہ تلاش کریں"
        actions={
          <Button className="bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/rishta/create">
              <Plus className="mr-1 h-4 w-4" />
              Apna Profile بنائیں
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="profiles">
        <TabsList className="mb-6">
          <TabsTrigger value="profiles" className="flex-1">
            <Heart className="mr-1.5 h-4 w-4" /> Profiles
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Meri Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="mt-0">
      {/* Filters */}
      <div className="mb-6 rounded-xl border bg-white">
        <button
          className="flex w-full items-center justify-between p-4 lg:hidden"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </span>
        </button>
        <div className={`grid gap-4 p-4 pt-0 lg:grid-cols-4 lg:pt-4 ${filtersOpen ? "" : "hidden lg:grid"}`}>
          <div className="space-y-1.5">
            <Label className="text-xs">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="کوئی بھی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">کوئی بھی</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Umar (saal)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" min={18} max={80} placeholder="18" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
              <span className="text-gray-400">—</span>
              <Input type="number" min={18} max={80} placeholder="60" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Education</Label>
            <Select value={education} onValueChange={setEducation}>
              <SelectTrigger>
                <SelectValue placeholder="کوئی بھی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">کوئی بھی</SelectItem>
                {EDUCATION_LEVELS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Profession</Label>
            <Input placeholder="e.g. Doctor" value={profession} onChange={(e) => setProfession(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sect</Label>
            <Select value={sect} onValueChange={setSect}>
              <SelectTrigger>
                <SelectValue placeholder="کوئی بھی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">کوئی بھی</SelectItem>
                {SECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">City</Label>
            <Input placeholder="e.g. Karachi" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Marital Status</Label>
            <Select value={maritalStatus} onValueChange={setMaritalStatus}>
              <SelectTrigger>
                <SelectValue placeholder="کوئی بھی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">کوئی بھی</SelectItem>
                {MARITAL_STATUSES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label} — {m.labelUrdu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Caste / Clan preference</Label>
            <Input placeholder="e.g. Arain" value={caste} onChange={(e) => setCaste(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && profiles.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border bg-white">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="کوئی ڈیٹا نہیں ملا"
          description="ان فلٹرز کے مطابق کوئی پروفائل نہیں ملی۔ فلٹرز بدل کر دیکھیں۔"
          actionLabel="تمام پروفائلز دیکھیں"
          onAction={() => {
            setGender("");
            setMinAge("");
            setMaxAge("");
            setEducation("");
            setProfession("");
            setSect("");
            setCity("");
            setMaritalStatus("");
            setCaste("");
          }}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <RishtaCard key={p.id} profile={p} />
            ))}
          </div>
          <Pagination
            hasMore={hasMore}
            isLoading={loading}
            onNext={() => nextCursor && fetchProfiles(nextCursor, false)}
            onPrev={() => fetchProfiles(undefined, true)}
          />
        </>
      )}
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <RequestsInbox />
        </TabsContent>
      </Tabs>
    </div>
  );
}
