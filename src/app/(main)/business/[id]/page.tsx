"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  ShieldCheck,
  Users,
  Loader2,
  Briefcase,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, relativeTimeEn, formatDate } from "@/lib/utils";
import { JOB_TYPES } from "@/lib/constants";

interface BusinessDetail {
  id: string;
  name: string;
  createdAt: string;
  description: string | null;
  industry: string | null;
  category: string | null;
  logo: string | null;
  coverImage: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  socialLinks: Array<{ platform: string; url: string }> | null;
  isVerified: boolean;
  isFeatured: boolean;
  isFamilyOwned: boolean;
  avgRating: number;
  isOwner: boolean;
  myReview: { rating: number; comment: string | null } | null;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
  }>;
  jobs: Array<{
    id: string;
    title: string;
    type: string;
    location: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    applicationsCount: number;
  }>;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
};

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [followed, setFollowed] = useState(false);

  const loadBusiness = () => {
    fetch(`/api/business/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setBusiness(json);
      })
      .catch(() => toast.error("بزنس لوڈ نہیں ہو سکا"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/business/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "جائزہ جمع نہیں ہو سکا");
        return;
      }
      toast.success("Review submit ho gayi! ⭐");
      setComment("");
      loadBusiness();
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Business nahi mila</h2>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/business">
            <ArrowLeft className="mr-1 h-4 w-4" />
            ڈائریکٹری پر واپس جائیں
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/business">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Business Directory
        </Link>
      </Button>

      {/* Banner */}
      <div className="relative h-44 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900">
        {business.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.coverImage} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-end gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-white text-2xl">
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo} alt="" className="h-full w-full rounded-xl object-cover" />
            ) : (
              "🏢"
            )}
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>{business.industry}</span>
              {business.isVerified && (
                <Badge variant="success">
                  <ShieldCheck className="mr-0.5 h-3 w-3" /> Verified
                </Badge>
              )}
              {business.isFamilyOwned && (
                <Badge variant="purple">
                  <Users className="mr-0.5 h-3 w-3" /> Family-owned
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business ke baare mein</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {business.description || "کوئی تفصیل نہیں ہے۔"}
              </p>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">
                Reviews ({business.reviews.length})
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold">{business.avgRating.toFixed(1)}</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Write review */}
              {!business.isOwner && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  {business.myReview ? (
                    <p className="text-sm text-gray-600">
                      Aapne review de diya hai: <strong>{business.myReview.rating}⭐</strong>
                      {business.myReview.comment && <> — &quot;{business.myReview.comment}&quot;</>}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button key={r} onClick={() => setRating(r)} aria-label={`${r} stars`}>
                            <Star
                              className={`h-7 w-7 ${
                                r <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                              } transition-colors hover:fill-amber-300`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        rows={3}
                        placeholder="اپنا تجربہ شیئر کریں..."
                        className="mt-3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="mt-3 bg-amber-500 hover:bg-amber-600"
                        onClick={handleReview}
                        disabled={submitting}
                      >
                        {submitting && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                        Review Submit Karein
                      </Button>
                    </>
                  )}
                </div>
              )}

              {business.reviews.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">Abhi koi review nahi hai</p>
              ) : (
                <div className="space-y-4">
                  {business.reviews.map((review) => (
                    <div key={review.id} className="flex items-start gap-3 border-b border-gray-50 pb-4 last:border-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(review.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{review.user.name}</span>
                          <span className="text-xs text-gray-400">{relativeTimeEn(review.createdAt)}</span>
                        </div>
                        <div className="mt-0.5 flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <Star
                              key={r}
                              className={`h-3.5 w-3.5 ${r <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                            />
                          ))}
                        </div>
                        {review.comment && <p className="mt-1.5 text-sm text-gray-600">{review.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs */}
          {business.jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Is business ki jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {business.jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="text-sm font-medium">{job.title}</div>
                        <div className="text-xs text-gray-500">
                          {JOB_TYPES.find((t) => t.value === job.type)?.label}
                          {job.location && ` · ${job.location}`}
                          {job.salaryMin && job.salaryMax && ` · ${job.currency} ${job.salaryMin.toLocaleString()}+`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{job.applicationsCount} applicants</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rabta Karein</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-700">
                  <Phone className="h-4 w-4" /> {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-700">
                  <Mail className="h-4 w-4" /> {business.email}
                </a>
              )}
              {business.website && (
                <a
                  href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-700"
                >
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {business.address && (
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {business.address}, {business.city}
                </p>
              )}
              {business.createdAt && (
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4" /> {formatDate(business.createdAt)} se registered
                </p>
              )}
              {business.socialLinks && business.socialLinks.length > 0 && (
                <div className="flex gap-2 border-t pt-3">
                  {business.socialLinks.map((s, i) => {
                    const Icon = socialIcons[s.platform.toLowerCase()] || Globe;
                    return (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant={followed ? "default" : "outline"}
            className="w-full"
            onClick={() => {
              setFollowed(!followed);
              toast.success(followed ? "ان فالو ہو گیا" : "Follow kar liya! Updates milti rahengi");
            }}
          >
            {followed ? "Following ✓" : "+ فالو کریں"}
          </Button>
        </div>
      </div>
    </div>
  );
}
