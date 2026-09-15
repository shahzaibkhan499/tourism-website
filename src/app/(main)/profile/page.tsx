"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, ShieldCheck, MapPin, Phone, Mail, Camera, Loader2, Heart, Save, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, initials } from "@/lib/utils";
import { PAKISTANI_CITIES, PAKISTANI_PROVINCES, BLOOD_GROUPS } from "@/lib/constants";
import { T } from "@/lib/i18n";
import type { UserBasic } from "@/types";
import { JobProfileSection } from "@/components/profile/job-profile-section";
import { BusinessProfileSection } from "@/components/profile/business-profile-section";
import { GeneralSection } from "@/components/profile/sections/general-section";
import { BirthSection } from "@/components/profile/sections/birth-section";
import { ContactSection } from "@/components/profile/sections/contact-section";
import { EducationSection } from "@/components/profile/sections/education-section";
import { ExperienceSection } from "@/components/profile/sections/experience-section";
import { FavoritesSection } from "@/components/profile/sections/favorites-section";
import { PersonalSection } from "@/components/profile/sections/personal-section";
import { AlertsSection } from "@/components/profile/sections/alerts-section";
import { OccupationCard } from "@/components/profile/sections/occupation-card";

interface EduEntry {
  degree: string;
  institute: string;
  year: string;
}

interface ProfileForm {
  name: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  city: string;
  province: string;
  bio: string;
  bloodGroup: string;
  occupation: string;
  educations: EduEntry[];
}

interface ProfileData extends UserBasic {
  _count: { events: number; memories: number; media: number; businesses: number };
  clan: { id: string; name: string; nameUrdu: string | null } | null;
  subClan: { id: string; name: string; nameUrdu: string | null } | null;
  rishtaProfile: { id: string; isActive: boolean; isVerified: boolean } | null;
  jobProfile: { id: string } | null;
  educations: EduEntry[] | null;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      city: "",
      province: "",
      bio: "",
      bloodGroup: "",
      occupation: "",
      educations: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "educations" });
  const bioValue = watch("bio");

  const loadProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setProfile(json);
        const existing: EduEntry[] = Array.isArray(json.educations) ? json.educations : [];
        reset({
          name: json.name || "",
          phone: json.phone || "",
          gender: json.gender || "",
          dateOfBirth: json.dateOfBirth ? json.dateOfBirth.slice(0, 10) : "",
          city: json.city || "",
          province: json.province || "",
          bio: json.bio || "",
          bloodGroup: json.bloodGroup || "",
          occupation: json.occupation || "",
          educations:
            existing.length > 0
              ? existing
              : json.education
                ? [{ degree: json.education, institute: "", year: "" }]
                : [],
        });
      })
      .catch(() => toast.error("پروفائل لوڈ نہیں ہو سکی"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async (data: ProfileForm) => {
    setSaving(true);
    try {
      const educations: EduEntry[] = data.educations
        .filter((e) => e.degree || e.institute || e.year)
        .map((e) => ({
          degree: e.degree ?? "",
          institute: e.institute ?? "",
          year: e.year ?? "",
        }));
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone || null,
          gender: data.gender || null,
          dateOfBirth: data.dateOfBirth || null,
          city: data.city || null,
          province: data.province || null,
          bio: data.bio || null,
          bloodGroup: data.bloodGroup || null,
          occupation: data.occupation || null,
          educations,
          education: educations[0]?.degree || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || "پروفائل محفوظ نہیں ہو سکی");
        return;
      }
      toast.success("پروفائل اپ ڈیٹ ہو گئی!");
      setEditOpen(false);
      loadProfile();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تصویر اپ لوڈ نہیں ہو سکی");
        return;
      }
      const updateRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data.url }),
      });
      if (!updateRes.ok) {
        toast.error("پروفائل فوٹو سیٹ نہیں ہو سکی");
        return;
      }
      toast.success("پروفائل تصویر اپ ڈیٹ ہو گئی!");
      loadProfile();
    } catch {
      toast.error("اپ لوڈ میں مسئلہ آ گیا");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-16 text-center text-gray-500">پروفائل نہیں ملی</p>;
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        titleUrdu="میری پروفائل"
        actions={
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button>
                <Pencil className="mr-1 h-4 w-4" />
                پروفائل میں ترمیم
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>پروفائل میں ترمیم کریں</DialogTitle>
                <DialogDescription>اپنی معلومات اپ ڈیٹ کریں</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSave)}>
                <div className="max-h-[60vh] grid gap-4 overflow-y-auto p-1 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>نام</Label>
                    <Input {...register("name")} />
                    {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input placeholder="03001234567" {...register("phone")} />
                    {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select value={watch("gender") || undefined} onValueChange={(v) => setValue("gender", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of Birth</Label>
                    <Input type="date" {...register("dateOfBirth")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Select value={watch("city") || undefined} onValueChange={(v) => setValue("city", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {PAKISTANI_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Province</Label>
                    <Select value={watch("province") || undefined} onValueChange={(v) => setValue("province", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAKISTANI_PROVINCES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Blood Group</Label>
                    <Select value={watch("bloodGroup") || undefined} onValueChange={(v) => setValue("bloodGroup", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="منتخب کریں" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Occupation</Label>
                    <Input {...register("occupation")} />
                  </div>

                  {/* Education — multi-entry (useFieldArray) */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Education — تعلیم (کئی درجے شامل ہو سکتے ہیں)</Label>
                    {fields.length === 0 && (
                      <p className="rounded-lg border border-dashed border-gray-300 p-2.5 text-center text-xs text-gray-500">
                        ابھی کوئی تعلیمی درجہ شامل نہیں — نیچے سے شامل کریں
                      </p>
                    )}
                    {fields.map((f, i) => (
                      <div key={f.id} className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 sm:grid-cols-[1fr_1fr_110px_auto]">
                        <Input
                          placeholder="Degree / Course — e.g. Bachelors"
                          {...register(`educations.${i}.degree`)}
                        />
                        <Input
                          placeholder="Institute — e.g. NUST"
                          {...register(`educations.${i}.institute`)}
                        />
                        <Input
                          placeholder="Year — e.g. 2020"
                          {...register(`educations.${i}.year`)}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="shrink-0 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ degree: "", institute: "", year: "" })}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add More Education — مزید تعلیم شامل کریں
                    </Button>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Bio (max 500 chars)</Label>
                    <Textarea
                      rows={3}
                      maxLength={500}
                      {...register("bio")}
                    />
                    <p className="text-right text-xs text-gray-400">{(bioValue ?? "").length}/500</p>
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  محفوظ کریں
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-green-500" />
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.image || undefined} />
                  <AvatarFallback className="text-2xl">{initials(profile.name)}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                  />
                </label>
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold">
                  {profile.name}{" "}
                  {profile.isVerified && (
                    <Badge variant="success" className="align-middle">
                      <ShieldCheck className="mr-0.5 h-3 w-3" /> Verified
                    </Badge>
                  )}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pb-1 text-sm text-gray-600">
              <span>📅 {profile._count.events} events</span>
              <span>📸 {profile._count.memories} memories</span>
              <span>💼 {profile._count.businesses} businesses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{T.profile.details}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.bio}</div>
              <p className="mt-1 text-sm text-gray-700">{profile.bio || T.profile.noBio}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.dateOfBirth}</div>
              <p className="mt-1 text-sm text-gray-700">{profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.city}</div>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-700">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {profile.city || "—"}, {profile.province || "—"}
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.bloodGroup}</div>
              <p className="mt-1 text-sm text-gray-700">{profile.bloodGroup || "—"}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.education}</div>
              <p className="mt-1 text-sm text-gray-700">
                {profile.educations && profile.educations.length > 0
                  ? profile.educations
                      .filter((e) => e.degree)
                      .map((e) => `${e.degree}${e.year ? ` (${e.year})` : ""}`)
                      .join(", ")
                  : profile.education || "—"}
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.clan}</div>
              <p className="mt-1 text-sm text-gray-700">
                {profile.clan ? (
                  <>
                    {profile.clan.name}{" "}
                    {profile.subClan && <span className="text-gray-500">({profile.subClan.name})</span>}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">{T.profile.memberSince}</div>
              <p className="mt-1 text-sm text-gray-700">{formatDate(profile.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="space-y-4">
          <Card className={profile.rishtaProfile ? "border-pink-200" : ""}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <Heart className="h-4 w-4 text-pink-600" />
                  Rishta Profile — رشتہ پروفائل
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {profile.rishtaProfile
                    ? profile.rishtaProfile.isActive
                      ? "Active ✓ — فعال ہے ✓"
                      : "Inactive — غیر فعال ہے"
                    : "Not created yet — ابھی نہیں بنایا"}
                </p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={profile.rishtaProfile ? `/rishta/${profile.rishtaProfile.id}` : "/rishta/create"}>
                  {profile.rishtaProfile ? "View — دیکھیں" : "Create — بنائیں"}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <JobProfileSection />
      <BusinessProfileSection />

      <div className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">Profile Sections — پروفائل سیکشنز</h2>
        <p dir="rtl" className="mb-4 font-urdu text-sm text-emerald-700">Click a section to open its form — جس پر کلک کریں، اس کا فارم کھل جائے گا</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GeneralSection profile={profile} onSaved={loadProfile} />
          <BirthSection profile={profile} onSaved={loadProfile} />
          <OccupationCard profile={profile} />
          <ContactSection profile={profile} onSaved={loadProfile} />
          <EducationSection profile={profile} onEdit={() => setEditOpen(true)} />
          <ExperienceSection profile={profile} onSaved={loadProfile} />
          <FavoritesSection profile={profile} onSaved={loadProfile} />
          <PersonalSection profile={profile} onSaved={loadProfile} />
          <AlertsSection profile={profile} onSaved={loadProfile} />
        </div>
      </div>
    </div>
  );
}
