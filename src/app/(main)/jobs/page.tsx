"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Briefcase, Search, MapPin, CalendarClock, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { JOB_TYPES } from "@/lib/constants";
import { formatDate, relativeTimeEn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { JobPostingItem } from "@/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const debouncedQ = useDebounce(q);

  const fetchJobs = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "10" });
        if (debouncedQ) params.set("q", debouncedQ);
        if (type !== "all") params.set("type", type);
        if (location) params.set("location", location);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/jobs?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "نوکریاں لوڈ نہیں ہو سکیں");
          return;
        }
        setJobs((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, type, location]
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div>
      <PageHeader
        title="Jobs"
        titleUrdu="نوکریاں"
        description="فیملی بزنسز کی قابلِ اعتماد نوکریاں"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/jobs/post">
              <Plus className="mr-1 h-4 w-4" />
              نوکری پوسٹ کریں
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="نوکری کا عنوان یا کمپنی تلاش کریں..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Job type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام اقسام</SelectItem>
            {JOB_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label} — {t.labelUrdu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative sm:w-52">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Location" className="pl-9" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="کوئی ڈیٹا نہیں ملا"
          description="ابھی کوئی نوکری نہیں ہے۔ بزنس مالکان نوکری پوسٹ کر سکتے ہیں۔"
          actionLabel="نوکری پوسٹ کریں"
          actionHref="/jobs/post"
        />
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <Card className="transition-all hover:border-emerald-200 hover:shadow-md">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 text-xl">
                      {job.business?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={job.business.logo} alt="" className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        "💼"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold group-hover:text-emerald-700">{job.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> {job.business?.name}
                          {job.business?.isVerified && <Badge variant="success" className="px-1 py-0 text-[9px]">✓</Badge>}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {job.location}
                          </span>
                        )}
                        {job.isRemote && <Badge variant="info" className="px-1.5 py-0 text-[10px]">Remote</Badge>}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{JOB_TYPES.find((t) => t.value === job.type)?.label || job.type}</Badge>
                        {job.salaryMin && job.salaryMax && (
                          <span className="text-xs font-medium text-emerald-700">
                            {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                          </span>
                        )}
                        {job.deadline && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <CalendarClock className="h-3 w-3" /> Deadline: {formatDate(job.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11px] text-gray-400">{relativeTimeEn(job.createdAt)}</span>
                      {job.myApplication ? (
                        <Badge variant={job.myApplication.status === "REJECTED" ? "destructive" : "success"}>
                          {job.myApplication.status === "APPLIED"
                            ? "Applied ✓"
                            : job.myApplication.status.charAt(0) + job.myApplication.status.slice(1).toLowerCase()}
                        </Badge>
                      ) : (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          Apply
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            hasMore={hasMore}
            isLoading={loading}
            onNext={() => nextCursor && fetchJobs(nextCursor, false)}
            onPrev={() => fetchJobs(undefined, true)}
          />
        </>
      )}
    </div>
  );
}
