"use client";

import Link from "next/link";
import { Briefcase, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  EMPLOYED: "ملازم",
  UNEMPLOYED: "بے روزگار",
  STUDENT: "طالب علم",
  RETIRED: "ریٹائرڈ",
  HOMEMAKER: "گھریلو",
};

export function OccupationCard({ profile }: { profile: any }) {
  const occ = profile?.occupationProfile;
  const filled = occ?.details ? Object.keys(occ.details).length : 0;
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            <span>Occupation</span>
            <span dir="rtl" className="font-urdu text-sm text-emerald-700">روزگار</span>
          </CardTitle>
          <CardDescription className="mt-0.5">ملازمت، بزنس، سرکاری یا میڈیکل شعبہ</CardDescription>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link href="/occupation">
            کھولیں <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-gray-600">
          {occ
            ? `${STATUS_LABELS[occ.employmentStatus] ?? occ.employmentStatus ?? "ملازم"} · ${filled} سیکشنز بھرے ہوئے`
            : "ابھی نہیں بھرا گیا"}
        </p>
      </CardContent>
    </Card>
  );
}
