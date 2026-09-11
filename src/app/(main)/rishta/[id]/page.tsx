"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  Send,
  Flag,
  Loader2,
  Lock,
  MapPin,
  GraduationCap,
  Briefcase,
  HeartHandshake,
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
import { MARITAL_STATUSES } from "@/lib/constants";

interface RishtaDetail {
  id: string;
  age: number | null;
  height: string | null;
  weight: string | null;
  complexion: string | null;
  education: string | null;
  educationDetail: string | null;
  profession: string | null;
  income: string | null;
  sect: string | null;
  maslak: string | null;
  castePreference: string | null;
  cityPreference: string | null;
  countryPreference: string | null;
  maritalStatus: string;
  children: number;
  about: string | null;
  familyBackground: string | null;
  expectations: string | null;
  photos: string[];
  isGuardianMode: boolean;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  isVerified: boolean;
  isPremium: boolean;
  viewsCount: number;
  isOwner: boolean;
  isApproved: boolean;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    gender: string | null;
    city: string | null;
    isVerified: boolean;
    clan: { name: string } | null;
  } | null;
}

export default function RishtaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [profile, setProfile] = useState<RishtaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/rishta/${id}`)
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

  const handleInterest = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/rishta/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: id, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "درخواست نہیں بھیجی جا سکی");
        return;
      }
      toast.success("دلچسپی بھیج دی گئی! 💚");
      setDialogOpen(false);
      setMessage("");
    } catch {
      toast.error("نیٹ ورک کی خرابی۔ دوبارہ کوشش کریں۔");
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (reason: string) => {
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId: profile?.user?.id,
          type: "Fake Profile",
          reason,
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
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Profile nahi mili</h2>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/rishta">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Rishta list par wapas jayen
          </Link>
        </Button>
      </div>
    );
  }

  const maritalLabel = MARITAL_STATUSES.find((m) => m.value === profile.maritalStatus)?.label || "Never Married";

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/rishta">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Sab Profiles
        </Link>
      </Button>

      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 text-3xl">
              {profile.user?.gender === "FEMALE" ? "🧕" : "👤"}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.user?.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {profile.age && <span>{profile.age} saal</span>}
                {profile.user?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.user.city}
                  </span>
                )}
                {profile.isVerified && (
                  <Badge variant="success">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {profile.viewsCount} views
                </span>
              </div>
            </div>
          </div>
          {!profile.isOwner && (
            <div className="flex gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Send className="mr-1 h-4 w-4" />
                    Interest Bhejein
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Interest Bhejein</DialogTitle>
                    <DialogDescription>
                      {profile.isGuardianMode
                        ? "یہ پروفائل گارڈین موڈ میں ہے۔ آپ کا پیغام گارڈین تک جائے گا۔"
                        : "آپ کا پیغام سیدھا پروفائل والے تک جائے گا۔"}
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    rows={4}
                    placeholder="اپنا تعارف اور فیملی کے بارے میں مختصر لکھیں..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleInterest} disabled={sending}>
                      {sending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Bhejein
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-600">
                    <Flag className="mr-1 h-4 w-4" />
                    Report
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Profile رپورٹ کریں</AlertDialogTitle>
                    <AlertDialogDescription>
                      کیا یہ پروفائل جعلی یا نامناسب لگتی ہے؟ رپورٹ کرنے پر ہماری ٹیم جائزہ لے گی۔
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleReport("یہ پروفائل جعلی یا نامناسب لگتی ہے")}
                    >
                      رپورٹ کریں
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      {profile.photos.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {profile.photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={photo} alt={`Photo ${i + 1}`} className="h-32 w-full rounded-lg object-cover" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!profile.isApproved && !profile.isOwner && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Lock className="h-5 w-5 shrink-0" />
          یہ پروفائل ابھی تصدیق شدہ نہیں ہے۔ تصاویر اور کچھ تفصیلات صرف تصدیق کے بعد دکھائی دیتی ہیں۔
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Personal details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <DetailRow label="Umar" value={profile.age ? `${profile.age} saal` : "—"} />
            <DetailRow label="Height" value={profile.height || "—"} />
            <DetailRow label="Weight" value={profile.weight || "—"} />
            <DetailRow label="Complexion" value={profile.complexion || "—"} />
            <DetailRow label="Marital Status" value={maritalLabel} />
            <DetailRow label="Children" value={profile.children > 0 ? String(profile.children) : "کوئی نہیں"} />
            <DetailRow label="City Preference" value={profile.cityPreference || "—"} />
            <DetailRow label="Country Preference" value={profile.countryPreference || "—"} />
            <DetailRow label="Caste/Clan Preference" value={profile.castePreference || "—"} />
          </CardContent>
        </Card>

        {/* Professional & religious */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taleem, Profession & Mazhab</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <DetailRow
              label="Education"
              value={
                profile.education ? (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> {profile.education}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="Education Detail" value={profile.educationDetail || "—"} />
            <DetailRow
              label="Profession"
              value={
                profile.profession ? (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {profile.profession}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="Income" value={profile.income || "—"} />
            <DetailRow label="Sect" value={profile.sect || "—"} />
            <DetailRow label="مسلک" value={profile.maslak || "—"} />
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taaruf</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-400">About</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {profile.about || "کوئی تعارف نہیں لکھا گیا"}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-400">Family Background</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {profile.familyBackground || "نہیں بتایا گیا"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Expectations & guardian */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expectations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {profile.expectations || "نہیں بتائی گئیں"}
              </p>
            </CardContent>
          </Card>

          {profile.isGuardianMode && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HeartHandshake className="h-4 w-4 text-blue-600" />
                  Guardian Info (Guardian Mode ON)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DetailRow label="Guardian Name" value={profile.guardianName || "—"} />
                <DetailRow label="رشتہ" value={profile.guardianRelation || "—"} />
                {profile.isApproved && <DetailRow label="Phone" value={profile.guardianPhone || "—"} />}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-0.5 text-sm text-gray-700">{value}</div>
    </div>
  );
}
