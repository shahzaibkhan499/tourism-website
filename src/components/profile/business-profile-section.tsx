"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, ExternalLink, Star, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessItem {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  isVerified: boolean;
  isFamilyOwned: boolean;
  jobCount: number;
  reviewCount: number;
  rating: number;
}

export function BusinessProfileSection() {
  const [items, setItems] = useState<BusinessItem[] | null>(null);

  useEffect(() => {
    fetch("/api/business?mine=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setItems(json?.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <Card id="business-profile" className="mt-6">
        <CardContent className="space-y-3 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="business-profile" className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-blue-600" />
            My Businesses — میرے بزنس
          </CardTitle>
          <CardDescription>آپ کی پورٹ فولیو — ایک سے زیادہ بزنس شامل ہو سکتے ہیں</CardDescription>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/business/create">
            <Plus className="mr-1 h-3.5 w-3.5" />
            بزنس شامل کریں
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <Building2 className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">آپ کا ابھی کوئی بزنس پروفائل نہیں ہے</p>
            <Button asChild size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/business/create">بزنس رجسٹر کریں</Link>
            </Button>
          </div>
        ) : (
          items.map((b) => (
            <div
              key={b.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900">{b.name}</span>
                  {b.isVerified && <Badge variant="success">تصدیق شدہ</Badge>}
                  {b.isFamilyOwned && <Badge variant="secondary">فیملی بزنس</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-gray-600">
                  {b.industry ?? "—"} {b.city ? `· ${b.city}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {b.reviewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {b.rating.toFixed(1)} ({b.reviewCount})
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {b.jobCount} جابز
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/business/${b.id}`}>
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    دیکھیں
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
