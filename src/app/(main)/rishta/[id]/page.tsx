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
import { MARITAL_STATUSES, CONTACT_RELATIONS } from "@/lib/constants";
import type { RishtaFormDetails } from "@/lib/validators";

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
  castePreference: string | null;
  cityPreference: string | null;
  countryPreference: string | null;
  maritalStatus: string;
  children: number;
  expectations: string | null;
  photos: string[];
  formDetails: RishtaFormDetails | null;
  isGuardianMode: boolean;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  isVerified: boolean;
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

const SECT_LABEL: Record<string, string> = { SUNNI: "Sunni", SHIA: "Shia", ANY: "Any — کوئی بھی" };
const BUILD_LABEL: Record<string, string> = { SLIM: "Slim", MEDIUM: "Medium", HEALTHY: "Healthy" };
const HOME_LABEL: Record<string, string> = { OWN: "Own — اپنا", RENT: "Rent — کرایہ" };
const PERDA_LABEL: Record<string, string> = { YES: "Yes", NO: "No", ANY: "Doesn't Matter" };

function labelFor(list: readonly { value: string; label: string; labelUrdu: string }[], v: string | null | undefined) {
  const m = list.find((x) => x.value === v);
  return m ? `${m.label} — ${m.labelUrdu}` : v ?? "—";
}

function Row({ label, urdu, value }: { label: string; urdu: string; value?: React.ReactNode }) {
  const empty = value == null || value === "" || value === "—";
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <span>{label}</span>
        <span dir="rtl" className="font-urdu normal-case text-gray-400">{urdu}</span>
      </div>
      <div className="mt-0.5 break-words text-sm text-gray-700">
        {empty ? <span className="text-gray-300">—</span> : value}
      </div>
    </div>
  );
}

function SectionCard({ title, urdu, children }: { title: string; urdu: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-baseline gap-x-2.5 text-base">
          <span>{title}</span>
          <span dir="rtl" className="font-urdu text-sm text-pink-700">{urdu}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
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

  const handleReport = async () => {
    if (!profile) return;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedId: profile.user?.id,
          type: "Fake Profile",
          reason: "یہ پروفائل جعلی یا نامناسب لگتی ہے",
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

  const fd = profile.formDetails ?? null;
  const maritalLabel = MARITAL_STATUSES.find((m) => m.value === profile.maritalStatus)?.label || profile.maritalStatus;
  const contactLabel = labelFor(CONTACT_RELATIONS, fd?.contact?.relation);

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
              <h1 className="text-xl font-bold">{fd?.personal?.name || profile.user?.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {profile.age && <span>{profile.age} saal</span>}
                {fd?.house?.currentCity ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {fd.house.currentCity}
                  </span>
                ) : profile.user?.city ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.user.city}
                  </span>
                ) : null}
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
                        ? "یہ پروفائل سرپرست موڈ میں ہے۔ آپ کا پیغام سرپرست تک جائے گا۔"
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
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleReport}>
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
            <CardTitle className="text-base">Photos — تصاویر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile.photos.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={photo} alt={`Photo ${i + 1}`} className="h-40 w-full rounded-lg object-cover" />
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
        {fd ? (
          <>
            <SectionCard title="Personal Information" urdu="ذاتی معلومات">
              <Row label="Gender" urdu="جنس" value={fd.personal?.gender === "FEMALE" ? "Female — لڑکی" : "Male — لڑکا"} />
              <Row label="Name" urdu="نام" value={fd.personal?.name} />
              <Row label="Date of Birth" urdu="تاریخ پیدائش" value={fd.personal?.dateOfBirth} />
              <Row label="Marital Status" urdu="تأثیری حیثیت" value={maritalLabel} />
              <Row label="Mother Tongue" urdu="مادری زبان" value={fd.personal?.motherTongue} />
              <Row label="Children" urdu="بچے" value={profile.children > 0 ? String(profile.children) : "کوئی نہیں"} />
            </SectionCard>

            <SectionCard title="Physical Appearance" urdu="جسمانی ساخت">
              <Row label="Height" urdu="قد" value={profile.height} />
              <Row label="Weight" urdu="وزن" value={profile.weight ? `${profile.weight} kg` : undefined} />
              <Row label="Complexion / Build" urdu="رنگت / ساخت" value={BUILD_LABEL[fd.physical?.build ?? ""] ?? fd.physical?.build} />
              <Row
                label="Disability"
                urdu="معذوری"
                value={fd.physical?.disability ? `جی ہاں — ${fd.physical?.disabilityDetails ?? ""}` : "نہیں"}
              />
            </SectionCard>

            {fd.education && fd.education.length > 0 && (
              <SectionCard title="Education Details" urdu="تعلیمی تفصیلات">
                {fd.education.map((e, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 sm:col-span-2">
                    <p className="text-sm font-semibold text-gray-800">{e.qualification || "—"} {e.course ? `· ${e.course}` : ""}</p>
                    <div className="mt-1 grid gap-x-6 gap-y-2 sm:grid-cols-3">
                      <Row label="School" urdu="اسکول" value={e.school} />
                      <Row label="College" urdu="کالج" value={e.college} />
                      <Row label="University" urdu="یونیورسٹی" value={e.university} />
                    </div>
                  </div>
                ))}
              </SectionCard>
            )}

            <SectionCard title="Job / Business" urdu="نوکری / کاروبار">
              <Row label="Company / Business" urdu="کمپنی / بزنس" value={fd.job?.company} />
              <Row label="Nature" urdu="نوعیت" value={profile.profession ?? fd.job?.nature} />
              <Row label="Place of Work" urdu="کام کی جگہ" value={fd.job?.place} />
              <Row label="Rank / Position" urdu="عہدہ" value={fd.job?.rank} />
              <Row label="Monthly Income" urdu="ماہانہ آمدنی" value={profile.income ? `PKR ${profile.income}` : undefined} />
              <div className="sm:col-span-2">
                <Row label="Future Plans" urdu="مستقبل کے منصوبے" value={fd.job?.futurePlans} />
              </div>
            </SectionCard>

            <SectionCard title="Cultural & Ethical" urdu="ثقافتی و اخلاقی">
              <Row label="Languages" urdu="زبانیں" value={fd.cultural?.languages?.length ? fd.cultural.languages.join(", ") : undefined} />
              <Row label="Caste" urdu="ذات" value={fd.cultural?.caste} />
              <Row label="Sub Cast / Ethnicity" urdu="ذیلی ذات" value={fd.cultural?.subCast} />
              <div className="sm:col-span-2">
                <Row label="Hobbies" urdu="مشاغل" value={fd.cultural?.hobbies} />
              </div>
            </SectionCard>

            <SectionCard title="Religion" urdu="مذہب">
              <Row label="Religion" urdu="مذہب" value="Islam" />
              <Row label="Sect (Maslak)" urdu="مسلک" value={SECT_LABEL[fd.religion?.sect ?? ""] ?? fd.religion?.sect} />
            </SectionCard>

            <SectionCard title="House Details" urdu="گھر کی تفصیلات">
              <Row label="Home" urdu="گھر" value={HOME_LABEL[fd.house?.home ?? ""] ?? undefined} />
              <Row label="Size" urdu="سائز" value={fd.house?.size} />
              <Row label="Location" urdu="مقام" value={fd.house?.location} />
              <Row label="Land Owned" urdu="زمین" value={fd.house?.land ? "جی ہاں" : "نہیں"} />
              <Row label="Vehicles" urdu="گاڑیاں" value={fd.house?.vehicles} />
              <Row label="Address" urdu="پتہ" value={fd.house?.address} />
              <Row label="Current City" urdu="موجودہ شہر" value={fd.house?.currentCity} />
              <Row label="Nationality" urdu="قومیت" value={fd.house?.nationality} />
              <div className="sm:col-span-2">
                <Row label="Home Town" urdu="آبائی شہر" value={fd.house?.homeTown} />
              </div>
            </SectionCard>

            <SectionCard title="Family Details" urdu="خاندان کی تفصیلات">
              <Row label="Father Name" urdu="والد کا نام" value={fd.family?.fatherName} />
              <Row label="Father's Occupation" urdu="والد کا پیشہ" value={fd.family?.fatherOccupation} />
              <Row label="Father Mobile" urdu="والد کا موبائل" value={profile.isApproved || profile.isOwner ? fd.family?.fatherMobile : undefined} />
              <Row label="Mother Name" urdu="والدہ کا نام" value={fd.family?.motherName} />
              <Row label="Mother's Occupation" urdu="والدہ کا پیشہ" value={fd.family?.motherOccupation} />
              <Row label="Mother Mobile" urdu="والدہ کا موبائل" value={profile.isApproved || profile.isOwner ? fd.family?.motherMobile : undefined} />
              <Row label="Brothers" urdu="بھائی" value={fd.family?.brothers ? `${fd.family.brothers} (${fd.family.brothersMarried ?? 0} married)` : "0"} />
              <Row label="Sisters" urdu="بہنیں" value={fd.family?.sisters ? `${fd.family.sisters} (${fd.family.sistersMarried ?? 0} married)` : "0"} />
            </SectionCard>

            <SectionCard title="Life Partner Requirements" urdu="زندگی کے ساتھی کی ضروریات">
              <Row label="Status Required" urdu="حیثیت" value={fd.partner?.statuses?.length ? fd.partner.statuses.map((s) => labelFor(MARITAL_STATUSES, s)).join(", ") : "کوئی ترجیح نہیں"} />
              <Row
                label="Age Between"
                urdu="عمر کے درمیان"
                value={fd.partner?.minAge || fd.partner?.maxAge ? `${fd.partner?.minAge ?? "?"} – ${fd.partner?.maxAge ?? "?"}` : undefined}
              />
              <Row label="Height Required" urdu="قد" value={fd.partner?.minHeight ? `≥ ${fd.partner.minHeight}` : "کوئی شرط نہیں"} />
              <Row label="City Required" urdu="شہر" value={fd.partner?.city || "کوئی شرط نہیں"} />
              <Row label="Caste Required" urdu="ذات" value={fd.partner?.caste || "کوئی شرط نہیں"} />
              <Row label="Sect Required" urdu="مسلک" value={SECT_LABEL[fd.partner?.sect ?? ""] ?? fd.partner?.sect} />
              <Row label="Qualification Required" urdu="تعلیم" value={fd.partner?.qualification || "کوئی شرط نہیں"} />
              <Row label="Sharia Perda" urdu="شریعتِ پردہ" value={PERDA_LABEL[fd.partner?.shariaPerda ?? ""] ?? fd.partner?.shariaPerda} />
              <Row label="Divorced Acceptable?" urdu="طلاق یافتہ مناسب؟" value={fd.partner?.divorcedAcceptable ? "جی ہاں" : "نہیں"} />
              <div className="sm:col-span-2">
                <Row label="Any Other Requirements" urdu="دیگر ضروریات" value={profile.expectations ?? fd.partner?.otherRequirements} />
              </div>
            </SectionCard>

            <SectionCard title="Contact Person" urdu="رابطہ شخص">
              <Row label="Person Name" urdu="شخص کا نام" value={fd.contact?.personName} />
              <Row label="Relation" urdu="رشتہ" value={contactLabel} />
              <Row
                label="Mobile No"
                urdu="موبائل"
                value={profile.isApproved || profile.isOwner ? fd.contact?.mobile : undefined}
              />
            </SectionCard>
          </>
        ) : (
          <>
            {/* Fallback for pre-overhaul profiles */}
            <SectionCard title="Personal Details" urdu="ذاتی معلومات">
              <Row label="Age" urdu="عمر" value={profile.age ? `${profile.age} saal` : undefined} />
              <Row label="Height" urdu="قد" value={profile.height} />
              <Row label="Weight" urdu="وزن" value={profile.weight} />
              <Row label="Complexion" urdu="رنگت" value={profile.complexion} />
              <Row label="Marital Status" urdu="حیثیت" value={maritalLabel} />
              <Row label="Children" urdu="بچے" value={profile.children > 0 ? String(profile.children) : "کوئی نہیں"} />
            </SectionCard>
            <SectionCard title="Taleem, Profession & Mazhab" urdu="تعلیم، پیشہ اور مذہب">
              <Row label="Education" urdu="تعلیم" value={profile.education} />
              <Row label="Education Detail" urdu="تفصیل" value={profile.educationDetail} />
              <Row label="Profession" urdu="پیشہ" value={profile.profession} />
              <Row label="Income" urdu="آمدنی" value={profile.income} />
              <Row label="Sect" urdu="مسلک" value={profile.sect} />
            </SectionCard>
          </>
        )}

        {(profile.isGuardianMode || (fd && fd.contact?.relation && fd.contact.relation !== "SELF")) && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Guardian / Contact — سرپرست</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Name" urdu="نام" value={profile.guardianName} />
              <Row label="Relation" urdu="رشتہ" value={profile.guardianRelation} />
              <Row
                label="Phone"
                urdu="فون"
                value={profile.isApproved || profile.isOwner ? profile.guardianPhone : undefined}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
