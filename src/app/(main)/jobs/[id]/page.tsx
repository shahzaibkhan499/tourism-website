"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  CalendarClock,
  Banknote,
  Loader2,
  CheckCircle2,
  Globe,
  Upload,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JOB_TYPES, APPLICATION_STATUSES } from "@/lib/constants";
import { formatDate, relativeTimeEn } from "@/lib/utils";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  type: string;
  experience: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  location: string | null;
  isRemote: boolean;
  deadline: string | null;
  createdAt: string;
  myApplication: { status: string; appliedAt: string } | null;
  business: {
    id: string;
    name: string;
    logo: string | null;
    city: string | null;
    industry: string | null;
    isVerified: boolean;
    isFamilyOwned: boolean;
    website: string | null;
    avgRating: number;
    reviewCount: number;
  } | null;
  relatedJobs: Array<{
    id: string;
    title: string;
    type: string;
    business: { name: string; logo: string | null; city: string | null };
  }>;
}

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setJob(json);
      })
      .catch(() => toast.error("نوکری لوڈ نہیں ہو سکی"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobPostingId: id, coverLetter }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "درخواست نہیں بھیجی جا سکی");
        return;
      }
      toast.success("Application bhej di gayi! 🎉");
      setApplyOpen(false);
      setCoverLetter("");
      setJob((prev) =>
        prev ? { ...prev, myApplication: { status: "APPLIED", appliedAt: new Date().toISOString() } } : prev
      );
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48 md:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Job nahi mili</h2>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/jobs">
            <ArrowLeft className="mr-1 h-4 w-4" />
            نوکریوں پر واپس جائیں
          </Link>
        </Button>
      </div>
    );
  }

  const typeLabel = JOB_TYPES.find((t) => t.value === job.type)?.label || job.type;
  const myApplication = job.myApplication;
  const myStatus = myApplication
    ? APPLICATION_STATUSES.find((s) => s.value === myApplication.status)
    : null;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/jobs">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Sab Jobs
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  {job.business?.name}
                  {job.business?.isVerified && <Badge variant="success" className="px-1 py-0 text-[9px]">✓ Verified</Badge>}
                </span>
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </span>
                )}
                <Badge variant="secondary">{typeLabel}</Badge>
                {job.isRemote && <Badge variant="info">Remote</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                {job.salaryMin && job.salaryMax && (
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <Banknote className="h-4 w-4" />
                    {job.currency} {job.salaryMin.toLocaleString()} – {job.salaryMax.toLocaleString()}
                  </span>
                )}
                {job.experience && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Briefcase className="h-4 w-4" /> {job.experience} experience
                  </span>
                )}
                {job.deadline && (
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <CalendarClock className="h-4 w-4" /> Deadline: {formatDate(job.deadline)}
                  </span>
                )}
              </div>
            </div>
            {job.myApplication ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <div className="mt-1 text-sm font-semibold text-emerald-800">
                  {myStatus?.label || job.myApplication.status}
                </div>
                <div className="text-xs text-emerald-600">{relativeTimeEn(job.myApplication.appliedAt)}</div>
              </div>
            ) : (
              <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                    Apply Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>درخواست دیں — {job.title}</DialogTitle>
                    <DialogDescription>
                      آپ کی جاب پروفائل سے تفصیلات خود بھر جائیں گی۔ کور لیٹر لکھیں۔
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Textarea
                      rows={5}
                      placeholder="کور لیٹر — اپنے بارے میں اور اس نوکری کے لیے کیوں درخواست دے رہے ہیں..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Upload className="h-3.5 w-3.5" />
                      ریزیومے آپ کی جاب پروفائل سے استعمال ہوگا (پروفائل &gt; جاب پروفائل میں اپ ڈیٹ کریں)
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApplyOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApply} disabled={applying}>
                      {applying && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Application Bhejein
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{job.description}</p>
            </CardContent>
          </Card>

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{job.requirements}</p>
              </CardContent>
            </Card>
          )}

          {/* Related jobs */}
          {job.relatedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.relatedJobs.map((rj) => (
                  <Link
                    key={rj.id}
                    href={`/jobs/${rj.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div>
                      <div className="text-sm font-medium">{rj.title}</div>
                      <div className="text-xs text-gray-500">
                        {rj.business.name} · {JOB_TYPES.find((t) => t.value === rj.type)?.label}
                      </div>
                    </div>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-gray-300" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Company card */}
        {job.business && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  {job.business.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.business.logo} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    "🏢"
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold">{job.business.name}</div>
                  <div className="text-xs text-gray-500">{job.business.industry}</div>
                </div>
              </div>
              {job.business.isFamilyOwned && (
                <Badge variant="purple" className="w-fit">
                  👨‍👩‍👧‍👦 Family-Owned Business
                </Badge>
              )}
              {job.business.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" /> {job.business.city}
                </div>
              )}
              {job.business.website && (
                <a
                  href={job.business.website.startsWith("http") ? job.business.website : `https://${job.business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                >
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {job.business.reviewCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 p-2.5 text-sm">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="font-semibold">{job.business.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({job.business.reviewCount} reviews)</span>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/business/${job.business.id}`}>Business Page دیکھیں</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
