"use client";

/**
 * Round 10 — BIRTH event form (6 parts, exact spec fields).
 * Saves all fields to Event.details JSON.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOOD_TYPES,
  DELIVERY_TYPES,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  RELIGIONS,
} from "@/lib/constants";
import {
  CancelBackLink,
  Field,
  InviteesPicker,
  Part,
  SelectField,
  UploadField,
  useEventSubmit,
  useSelectFormValue,
  type Invitee,
  type Opt,
} from "./form-parts";
import { InviteAudienceSelect } from "@/components/events/invite-audience";
import type { InviteAudience } from "@/lib/event-invites";

const opt = (o: { value: string; label: string; labelUrdu: string }): Opt => o;
const plain = (v: string): Opt => ({ value: v, label: v });

const schema = z.object({
  // Part I — General
  firstName: z.string().min(1, "پہلا نام ضروری ہے — First name is required"),
  middleName: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  firstPicture: z.string().optional().nullable(),
  // Part II — Family references
  father: z.string().optional().nullable(),
  grandfather: z.string().optional().nullable(),
  mother: z.string().optional().nullable(),
  sister: z.string().optional().nullable(),
  brother: z.string().optional().nullable(),
  cast: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  // Part III — Birth details
  gender: z.string().min(1, "جنس منتخب کریں"),
  dateOfBirth: z.string().min(1, "تاریخِ پیدائش ضروری ہے — Date of birth is required"),
  placeOfBirth: z.string().optional().nullable(),
  exactTime: z.string().optional().nullable(),
  apgarScore: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  length: z.string().optional().nullable(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  physicalDescription: z.string().optional().nullable(),
  // Part IV — Medical / Hospital
  homeOrHospital: z.string().optional(),
  hospitalName: z.string().optional().nullable(),
  doctorDai: z.string().optional().nullable(),
  deliveryType: z.string().optional(),
  complications: z.string().optional().nullable(),
  vaccinationCard: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  healthNotes: z.string().optional().nullable(),
  bloodType: z.string().optional(),
  // Part V — Personal / Legal
  religion: z.string().optional(),
  nationality: z.string().optional().nullable(),
  birthNotification: z.string().optional().nullable(),
  birthCertificate: z.string().optional().nullable(),
  exactSpellings: z.string().optional().nullable(),
  fatherCnic: z.string().optional().nullable(),
  motherCnic: z.string().optional().nullable(),
  // Part VI — Keepsakes
  firstPhoto: z.string().optional().nullable(),
  firstVideo: z.string().optional().nullable(),
  footprintsImage: z.string().optional().nullable(),
  wristbandImage: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

const empty: FormData = {
  firstName: "",
  middleName: null,
  surname: null,
  nickname: null,
  firstPicture: null,
  father: null,
  grandfather: null,
  mother: null,
  sister: null,
  brother: null,
  cast: null,
  origin: null,
  gender: "MALE",
  dateOfBirth: "",
  placeOfBirth: null,
  exactTime: null,
  apgarScore: null,
  weight: null,
  length: null,
  hairColor: "BLACK",
  eyeColor: "BROWN",
  physicalDescription: null,
  homeOrHospital: "HOSPITAL",
  hospitalName: null,
  doctorDai: null,
  deliveryType: "VAGINAL",
  complications: null,
  vaccinationCard: null,
  city: null,
  healthNotes: null,
  bloodType: "O+",
  religion: "ISLAM",
  nationality: "Pakistani",
  birthNotification: null,
  birthCertificate: null,
  exactSpellings: null,
  fatherCnic: null,
  motherCnic: null,
  firstPhoto: null,
  firstVideo: null,
  footprintsImage: null,
  wristbandImage: null,
};

export default function BirthEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  // Round 12 (Fix 1) — bulk invite audience
  const [audience, setAudience] = useState<InviteAudience>("SPECIFIC");
  const { loading, submit } = useEventSubmit();

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: empty });
  const { register, handleSubmit, setValue, watch, formState } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    fetch(`/api/events/${editId}`)
      .then((r) => r.json())
      .then((ev) => {
        if (cancelled || ev.error) return;
        const d = ev.details ?? {};
        const p1 = d.part1 ?? {};
        const fam = d.family ?? {};
        const b = d.birth ?? {};
        const med = d.medical ?? {};
        const leg = d.legal ?? {};
        const keep = d.keepsakes ?? {};
        const set = (k: string, v: unknown) => setValue(k as never, v as never, { shouldValidate: false });
        set("firstName", p1.firstName ?? "");
        set("middleName", p1.middleName ?? null);
        set("surname", p1.surname ?? null);
        set("nickname", p1.nickname ?? null);
        set("firstPicture", p1.firstPicture ?? null);
        set("father", fam.father ?? null);
        set("grandfather", fam.grandfather ?? null);
        set("mother", fam.mother ?? null);
        set("sister", fam.sister ?? null);
        set("brother", fam.brother ?? null);
        set("cast", fam.cast ?? null);
        set("origin", fam.origin ?? null);
        set("gender", b.gender ?? "MALE");
        const dob = b.dateOfBirth ? new Date(b.dateOfBirth) : null;
        set("dateOfBirth", dob && !Number.isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : "");
        set("placeOfBirth", b.placeOfBirth ?? null);
        set("exactTime", b.exactTime ?? null);
        set("apgarScore", b.apgarScore != null ? String(b.apgarScore) : null);
        set("weight", b.weight != null ? String(b.weight) : null);
        set("length", b.length != null ? String(b.length) : null);
        set("hairColor", b.hairColor ?? "BLACK");
        set("eyeColor", b.eyeColor ?? "BROWN");
        set("physicalDescription", b.physicalDescription ?? null);
        set("homeOrHospital", med.homeOrHospital ?? "HOSPITAL");
        set("hospitalName", med.hospitalName ?? null);
        set("doctorDai", med.doctorDai ?? null);
        set("deliveryType", med.deliveryType ?? "VAGINAL");
        set("complications", med.complications ?? null);
        set("vaccinationCard", med.vaccinationCard ?? null);
        set("city", med.city ?? null);
        set("healthNotes", med.healthNotes ?? null);
        set("bloodType", med.bloodType ?? "O+");
        set("religion", leg.religion ?? "ISLAM");
        set("nationality", leg.nationality ?? "Pakistani");
        set("birthNotification", leg.birthNotification ?? null);
        set("birthCertificate", leg.birthCertificate ?? null);
        set("exactSpellings", leg.exactSpellings ?? null);
        set("fatherCnic", leg.fatherCnic ?? null);
        set("motherCnic", leg.motherCnic ?? null);
        set("firstPhoto", keep.firstPhoto ?? null);
        set("firstVideo", keep.firstVideo ?? null);
        set("footprintsImage", keep.footprintsImage ?? null);
        set("wristbandImage", keep.wristbandImage ?? null);
      })
      .catch(() => {
        if (!cancelled) router.push("/events");
      });
    return () => {
      cancelled = true;
    };
  }, [editId, router, setValue]);

  const genderSel = useSelectFormValue(form, "gender");
  const hairSel = useSelectFormValue(form, "hairColor");
  const eyeSel = useSelectFormValue(form, "eyeColor");
  const homeSel = useSelectFormValue(form, "homeOrHospital");
  const deliverySel = useSelectFormValue(form, "deliveryType");
  const bloodSel = useSelectFormValue(form, "bloodType");
  const religionSel = useSelectFormValue(form, "religion");

  const onSubmit = async (data: FormData) => {
    const name = [data.firstName, data.middleName, data.surname].filter(Boolean).join(" ");
    const details = {
      part1: {
        firstName: data.firstName,
        middleName: data.middleName || null,
        surname: data.surname || null,
        nickname: data.nickname || null,
        firstPicture: data.firstPicture || null,
      },
      family: {
        father: data.father || null,
        grandfather: data.grandfather || null,
        mother: data.mother || null,
        sister: data.sister || null,
        brother: data.brother || null,
        cast: data.cast || null,
        origin: data.origin || null,
      },
      birth: {
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth || null,
        exactTime: data.exactTime || null,
        apgarScore: data.apgarScore ? Number(data.apgarScore) || null : null,
        weight: data.weight || null,
        length: data.length || null,
        hairColor: data.hairColor,
        eyeColor: data.eyeColor,
        physicalDescription: data.physicalDescription || null,
      },
      medical: {
        homeOrHospital: data.homeOrHospital,
        hospitalName: data.hospitalName || null,
        doctorDai: data.doctorDai || null,
        deliveryType: data.deliveryType,
        complications: data.complications || null,
        vaccinationCard: data.vaccinationCard || null,
        city: data.city || null,
        healthNotes: data.healthNotes || null,
        bloodType: data.bloodType,
      },
      legal: {
        religion: data.religion,
        nationality: data.nationality || null,
        birthNotification: data.birthNotification || null,
        birthCertificate: data.birthCertificate || null,
        exactSpellings: data.exactSpellings || null,
        fatherCnic: data.fatherCnic || null,
        motherCnic: data.motherCnic || null,
      },
      keepsakes: {
        firstPhoto: data.firstPhoto || null,
        firstVideo: data.firstVideo || null,
        footprintsImage: data.footprintsImage || null,
        wristbandImage: data.wristbandImage || null,
      },
    };

    await submit(editId, {
      title: `${name} کی پیدائش — Welcome ${data.firstName}`,
      type: "BIRTH",
      date: data.dateOfBirth,
      time: data.exactTime || null,
      location: data.placeOfBirth || data.city || null,
      details,
      invitees: invitees.map((i) => i.id),
      audience,
      isPublic: false,
      isRecurring: false,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Birth Record — Naya Aagay"
        titleUrdu="پیدائش کا ریکارڈ — نئی آمد"
        description="نوزائیدے کی مکمل معلومات درج کریں — طبی، قانونی اور یادگار تصاویر سمیت۔ خاندان کو مبارکباد Digital Card ملے گا۔"
      />
      <div className="mb-4">
        <CancelBackLink href={editId ? `/events/${editId}` : "/events/create"} label="واپس — Back to grid" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Part n={1} title="General" titleUrdu="بنیادی معلومات">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First Name" labelUrdu="پہلا نام" error={errors.firstName?.message} required>
              <Input placeholder="e.g. Ayaan" {...register("firstName")} />
            </Field>
            <Field label="Middle Name" labelUrdu="درمیانی نام">
              <Input {...register("middleName")} />
            </Field>
            <Field label="Surname" labelUrdu="خاندانی نام">
              <Input {...register("surname")} />
            </Field>
            <Field label="Nickname" labelUrdu="کنی">
              <Input {...register("nickname")} />
            </Field>
            <div className="sm:col-span-2">
              <UploadField label="First Birth Picture" labelUrdu="پہلی پیدائش کی تصویر" value={watch("firstPicture") ?? undefined} onChange={(v) => setValue("firstPicture", v || null, { shouldValidate: true })} />
            </div>
          </div>
        </Part>

        <Part n={2} title="Family References" titleUrdu="خاندانی حوالہ جات">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Father" labelUrdu="باپ">
              <Input {...register("father")} />
            </Field>
            <Field label="Grandfather" labelUrdu="دادا">
              <Input {...register("grandfather")} />
            </Field>
            <Field label="Mother" labelUrdu="ماں">
              <Input {...register("mother")} />
            </Field>
            <Field label="Sister" labelUrdu="بہن">
              <Input {...register("sister")} />
            </Field>
            <Field label="Brother" labelUrdu="بھائی">
              <Input {...register("brother")} />
            </Field>
            <Field label="Cast" labelUrdu="قبیلہ">
              <Input {...register("cast")} />
            </Field>
            <Field label="Origin" labelUrdu="تعلقہ علاقہ">
              <Input placeholder="e.g. Miani, Sindh" {...register("origin")} />
            </Field>
          </div>
        </Part>

        <Part n={3} title="Birth Details" titleUrdu="پیدائش کی تفصیلات">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Gender" labelUrdu="جنس" options={GENDERS.map(opt)} value={genderSel.value} onValueChange={genderSel.onValueChange} error={errors.gender?.message} required />
            <Field label="Date of Birth" labelUrdu="تاریخِ پیدائش" error={errors.dateOfBirth?.message} required>
              <Input type="date" {...register("dateOfBirth")} />
            </Field>
            <Field label="Place of Birth" labelUrdu="جگہِ پیدائش">
              <Input placeholder="e.g. SHF Hospital, Karachi" {...register("placeOfBirth")} />
            </Field>
            <Field label="Exact Time" labelUrdu="درست وقت">
              <Input type="time" {...register("exactTime")} />
            </Field>
            <Field label="Apgar Score" labelUrdu="ایپگار اسکور">
              <Input type="number" min={0} max={10} placeholder="e.g. 9" {...register("apgarScore")} />
            </Field>
            <Field label="Weight" labelUrdu="وزن (kg)">
              <Input type="number" step="0.1" min={0} placeholder="e.g. 3.2" {...register("weight")} />
            </Field>
            <Field label="Length" labelUrdu="لمبائی (cm)">
              <Input type="number" min={0} placeholder="e.g. 50" {...register("length")} />
            </Field>
            <SelectField label="Hair Color" labelUrdu="بالوں کا رنگ" options={HAIR_COLORS.map(opt)} value={hairSel.value} onValueChange={hairSel.onValueChange} />
            <SelectField label="Eye Color" labelUrdu="آنکھوں کا رنگ" options={EYE_COLORS.map(opt)} value={eyeSel.value} onValueChange={eyeSel.onValueChange} />
            <Field label="Physical Description" labelUrdu="جسمانی تفصیل">
              <Input {...register("physicalDescription")} />
            </Field>
          </div>
        </Part>

        <Part n={4} title="Medical / Hospital" titleUrdu="طبی / ہسپتال">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Home / Hospital"
              labelUrdu="گھر / ہسپتال"
              options={[{ value: "HOME", label: "Home — گھر" }, { value: "HOSPITAL", label: "Hospital — ہسپتال" }]}
              value={homeSel.value}
              onValueChange={homeSel.onValueChange}
            />
            <Field label="Hospital Name" labelUrdu="ہسپتال کا نام">
              <Input {...register("hospitalName")} />
            </Field>
            <Field label="Doctor / Dai" labelUrdu="ڈاکٹر / دائی">
              <Input {...register("doctorDai")} />
            </Field>
            <SelectField label="Delivery Details" labelUrdu="زچگی کا طریقہ" options={DELIVERY_TYPES.map(opt)} value={deliverySel.value} onValueChange={deliverySel.onValueChange} />
            <Field label="Complications (if any)" labelUrdu="مسلکی (اگر کوئی ہو)">
              <Input {...register("complications")} />
            </Field>
            <div className="sm:col-span-2">
              <UploadField label="Vaccination Card" labelUrdu="ویکسینیشن کارڈ" value={watch("vaccinationCard") ?? undefined} onChange={(v) => setValue("vaccinationCard", v || null, { shouldValidate: true })} />
            </div>
            <Field label="City" labelUrdu="شہر">
              <Input {...register("city")} />
            </Field>
            <SelectField label="Blood Type" labelUrdu="بلڈ گروپ" options={BLOOD_TYPES.map(plain)} value={bloodSel.value} onValueChange={bloodSel.onValueChange} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Healthy / Disease Notes" labelUrdu="صحت کی نوٹس">
                <Textarea rows={2} placeholder="بچہ صحت مند ہے / کوئی مسئلہ..." {...register("healthNotes")} />
              </Field>
            </div>
          </div>
        </Part>

        <Part n={5} title="Personal / Legal" titleUrdu="شخصی / قانونی">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Religion" labelUrdu="مذہب" options={RELIGIONS.map(opt)} value={religionSel.value} onValueChange={religionSel.onValueChange} />
            <Field label="Nationality" labelUrdu="ملکیت">
              <Input defaultValue={undefined} {...register("nationality")} />
            </Field>
            <div>
              <UploadField label="Hospital Birth Notification" labelUrdu="زچگی کی اطلاع" value={watch("birthNotification") ?? undefined} onChange={(v) => setValue("birthNotification", v || null, { shouldValidate: true })} accept="image/jpeg,image/png,image/webp,application/pdf" />
            </div>
            <div>
              <UploadField label="Official Birth Certificate" labelUrdu="سرکاری پیدائش سرٹیفکیٹ" value={watch("birthCertificate") ?? undefined} onChange={(v) => setValue("birthCertificate", v || null, { shouldValidate: true })} accept="image/jpeg,image/png,image/webp,application/pdf" />
            </div>
            <Field label="Exact Name Spellings" labelUrdu="نام کی درست املا">
              <Input placeholder="جس طرح سرٹیفکیٹ پر درج ہے" {...register("exactSpellings")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Father's CNIC" labelUrdu="باپ کا سی این آئی سی">
                <Input placeholder="XXXXX-XXXXXXX-X" {...register("fatherCnic")} />
              </Field>
              <Field label="Mother's CNIC" labelUrdu="ماں کا سی این آئی سی">
                <Input placeholder="XXXXX-XXXXXXX-X" {...register("motherCnic")} />
              </Field>
            </div>
          </div>
        </Part>

        <Part n={6} title="Keepsakes" titleUrdu="یادگار چیزیں">
          <div className="grid gap-4 sm:grid-cols-2">
            <UploadField label="First Photo / Video" labelUrdu="پہلی تصویر / ویڈیو" value={watch("firstPhoto") ?? undefined} onChange={(v) => setValue("firstPhoto", v || null, { shouldValidate: true })} accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" />
            <UploadField label="Footprints Image" labelUrdu="پاؤں کے نشانات" value={watch("footprintsImage") ?? undefined} onChange={(v) => setValue("footprintsImage", v || null, { shouldValidate: true })} />
            <UploadField label="Hospital Wristband Image" labelUrdu="ہسپتال کی پہرانی تصویر" value={watch("wristbandImage") ?? undefined} onChange={(v) => setValue("wristbandImage", v || null, { shouldValidate: true })} />
          </div>
        </Part>

        <Part n={7} title="Invite Family (Digital Card)" titleUrdu="خاندان کو مدعو کریں" defaultOpen>
          <p className="mb-3 text-xs text-gray-500">
            مدعو ممبران کو اطلاع ملے گی اور وہ اسے کھول کر <span className="font-medium">Digital Card</span> دیکھ کر مبارکباد / دعا بھیج سکیں گے۔
          </p>
          <InviteAudienceSelect value={audience} onValueChange={setAudience} className="mb-3" />
          {audience === "SPECIFIC" ? (
            <InviteesPicker value={invitees} onChange={setInvitees} />
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <span dir="auto">
                <span dir="ltr">One-click invite:</span>{" "}
                <span dir="rtl" className="font-urdu">
                  {audience === "FAMILY"
                    ? "آپ کے فمیلی ٹری کے تمام ممبران کو"
                    : audience === "CLAN"
                      ? "آپ کے قبیلے کے تمام ممبران کو"
                      : "آپ کی کمیونٹی کے تمام ممبران کو"}{" "}
                  یہ ڈیجیٹل کارڈ بھیج دیا جائے گا۔
                </span>
              </span>
            </div>
          )}
        </Part>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "محفوظ ہو رہا ہے..." : "محفوظ کریں — Save & Invite"}
          </Button>
        </div>
      </form>
    </div>
  );
}
