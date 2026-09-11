"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, MapPin, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate, initials } from "@/lib/utils";
import { PublicSections } from "@/components/profile/public-sections";

interface PublicProfile {
  id: string;
  name: string | null;
  image: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  city: string | null;
  province: string | null;
  bio: string | null;
  bloodGroup: string | null;
  occupation: string | null;
  education: string | null;
  isVerified: boolean;
  createdAt: string;
  isOwn: boolean;
  clan: { name: string; nameUrdu: string | null } | null;
  subClan: { name: string; nameUrdu: string | null } | null;
  sections: Record<string, Record<string, unknown> | null>;
  occupationProfile: {
    employmentStatus: string | null;
    jobType: string | null;
    details: Record<string, Record<string, unknown>> | null;
  } | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setProfile(json);
      })
      .catch(() => toast.error("پروفائل لوڈ نہیں ہو سکی"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReport = async () => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId: id,
          type: "Inappropriate Content",
          reason: "یہ صارف نامناسب مواد یا رویے میں ملوث لگتا ہے",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "رپورٹ نہیں ہو سکی");
        return;
      }
      toast.success("رپورٹ جمع ہو گئی");
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">User nahi mila</h2>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            ڈیش بورڈ پر واپس جائیں
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Wapas
      </Button>

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-emerald-600 to-green-500" />
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile.image || undefined} />
                <AvatarFallback className="text-2xl">{initials(profile.name)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-2xl font-bold">
                  {profile.name}{" "}
                  {profile.isVerified && (
                    <Badge variant="success" className="align-middle">
                      <ShieldCheck className="mr-0.5 h-3 w-3" /> تصدیق شدہ
                    </Badge>
                  )}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  {profile.gender && <span>{profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()}</span>}
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.city}
                    </span>
                  )}
                  <span>ممبر از {formatDate(profile.createdAt, "MMM yyyy")}</span>
                </div>
              </div>
            </div>
            {!profile.isOwn && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600">
                    <Flag className="mr-1 h-4 w-4" />
                    Report
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>صارف کی رپورٹ کریں؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      ہماری ٹیم رپورٹ کا جائزہ لے گی اور مناسب کارروائی کرے گی۔
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>منسوخ</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleReport}>
                      رپورٹ کریں
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تعارف</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{profile.bio || "کوئی تعارف نہیں ہے"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400">Occupation</div>
              <p className="text-sm text-gray-700">{profile.occupation || "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400">Education</div>
              <p className="text-sm text-gray-700">{profile.education || "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400">Clan</div>
              <p className="text-sm text-gray-700">{profile.clan ? profile.clan.name : "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400">Sub-Clan</div>
              <p className="text-sm text-gray-700">{profile.subClan ? profile.subClan.name : "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400">Province</div>
              <p className="text-sm text-gray-700">{profile.province || "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400">Blood Group</div>
              <p className="text-sm text-gray-700">{profile.bloodGroup || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <PublicSections
        sections={profile.sections}
        occupation={profile.occupationProfile}
        isOwn={profile.isOwn}
      />
    </div>
  );
}
