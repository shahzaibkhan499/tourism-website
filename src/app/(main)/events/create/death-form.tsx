"use client";

/**
 * Round 10 — DEATH event form (7 parts, exact spec fields).
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
import {
  CAUSE_OF_DEATH_OPTIONS,
  DEATH_TITLE_PREFIXES,
  MARITAL_STATUSES,
  NAMAZ_AFTER_OPTIONS,
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

const schema = z.object({
  // Part I — General
  titlePrefix: z.string().optional(),
  firstName: z.string().min(1, "پہلا نام ضروری ہے — First name is required"),
  middleName: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  nickName: z.string().optional().nullable(),
  cast: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  currentCity: z.string().optional().nullable(),
  maritalStatus: z.string().optional(),
  age: z.string().optional().nullable(),
  // Part II — Family references
  husbandWife: z.string().optional().nullable(),
  father: z.string().optional().nullable(),
  mother: z.string().optional().nullable(),
  grandfather: z.string().optional().nullable(),
  grandmother: z.string().optional().nullable(),
  brothers: z.string().optional().nullable(),
  sisters: z.string().optional().nullable(),
  son: z.string().optional().nullable(),
  daughter: z.string().optional().nullable(),
  inlawFather: z.string().optional().nullable(),
  inlawMother: z.string().optional().nullable(),
  inlawBrother: z.string().optional().nullable(),
  inlawSister: z.string().optional().nullable(),
  picture: z.string().optional().nullable(),
  // Part III — Death details
  dateOfDeath: z.string().min(1, "تاریخِ وفات ضروری ہے — Date of death is required"),
  placeOfDeath: z.string().optional().nullable(),
  cause: z.string().min(1, "سببِ وفات منتخب کریں — Cause of death is required"),
  // Part IV — Namaz e Janaza
  namazDate: z.string().optional().nullable(),
  namazTime: z.string().optional().nullable(),
  afterNamaz: z.string().optional(),
  namazPlace: z.string().optional().nullable(),
  namazStreet: z.string().optional().nullable(),
  namazCity: z.string().optional().nullable(),
  namazState: z.string().optional().nullable(),
  namazCountry: z.string().optional().nullable(),
  namazMapLink: z.string().optional().nullable(),
  // Part V — Burial / Tadfeen
  burialPlace: z.string().optional().nullable(),
  burialStreet: z.string().optional().nullable(),
  burialCity: z.string().optional().nullable(),
  burialState: z.string().optional().nullable(),
  burialCountry: z.string().optional().nullable(),
  burialMapLink: z.string().optional().nullable(),
  // Part VI — Condolence venue & contact
  condStreet: z.string().optional().nullable(),
  condHouseNo: z.string().optional().nullable(),
  condCity: z.string().optional().nullable(),
  condCountry: z.string().optional().nullable(),
  condMapLink: z.string().optional().nullable(),
  condContactName: z.string().optional().nullable(),
  condContactRelation: z.string().optional().nullable(),
  condContactMobile: z.string().optional().nullable(),
  condWhatsApp: z.string().optional().nullable(),
  condComment: z.string().optional().nullable(),
  // Part VII — Social
  email: z.string().email().optional().or(z.literal("")).nullable(),
  web: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

const empty: FormData = {
  titlePrefix: "MR",
  firstName: "",
  middleName: null,
  surname: null,
  nickName: null,
  cast: null,
  origin: null,
  currentCity: null,
  maritalStatus: "MARRIED",
  age: null,
  husbandWife: null,
  father: null,
  mother: null,
  grandfather: null,
  grandmother: null,
  brothers: null,
  sisters: null,
  son: null,
  daughter: null,
  inlawFather: null,
  inlawMother: null,
  inlawBrother: null,
  inlawSister: null,
  picture: null,
  dateOfDeath: "",
  placeOfDeath: null,
  cause: "NATURAL_OLD_AGE",
  namazDate: null,
  namazTime: null,
  afterNamaz: "JUMMA",
  namazPlace: null,
  namazStreet: null,
  namazCity: null,
  namazState: null,
  namazCountry: "Pakistan",
  namazMapLink: null,
  burialPlace: null,
  burialStreet: null,
  burialCity: null,
  burialState: null,
  burialCountry: "Pakistan",
  burialMapLink: null,
  condStreet: null,
  condHouseNo: null,
  condCity: null,
  condCountry: "Pakistan",
  condMapLink: null,
  condContactName: null,
  condContactRelation: null,
  condContactMobile: null,
  condWhatsApp: null,
  condComment: null,
  email: null,
  web: null,
  twitter: null,
  facebook: null,
  instagram: null,
};

const PREFIX_LABELS: Record<string, string> = Object.fromEntries(DEATH_TITLE_PREFIXES.map((p) => [p.value, p.label]));

export default function DeathEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  // Round 12 (Fix 1) — bulk invite audience
  const [audience, setAudience] = useState<InviteAudience>("SPECIFIC");
  const { loading, submit } = useEventSubmit();

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: empty });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Edit mode: load existing event details
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
        const death = d.death ?? {};
        const nam = d.namaz ?? {};
        const bur = d.burial ?? {};
        const con = d.condolence ?? {};
        const soc = d.social ?? {};
        const set = (k: string, v: unknown) => setValue(k as never, v as never, { shouldValidate: false });
        set("titlePrefix", p1.title ?? "MR");
        set("firstName", p1.firstName ?? "");
        set("middleName", p1.middleName ?? null);
        set("surname", p1.surname ?? null);
        set("nickName", p1.nickName ?? null);
        set("cast", p1.cast ?? null);
        set("origin", p1.origin ?? null);
        set("currentCity", p1.currentCity ?? null);
        set("maritalStatus", p1.maritalStatus ?? "MARRIED");
        set("age", p1.age != null ? String(p1.age) : null);
        set("husbandWife", fam.husbandWife ?? null);
        set("father", fam.father ?? null);
        set("mother", fam.mother ?? null);
        set("grandfather", fam.grandfather ?? null);
        set("grandmother", fam.grandmother ?? null);
        set("brothers", fam.brothers ?? null);
        set("sisters", fam.sisters ?? null);
        set("son", fam.son ?? null);
        set("daughter", fam.daughter ?? null);
        set("inlawFather", fam.inlawFather ?? null);
        set("inlawMother", fam.inlawMother ?? null);
        set("inlawBrother", fam.inlawBrother ?? null);
        set("inlawSister", fam.inlawSister ?? null);
        set("picture", fam.picture ?? null);
        const dod = death.dateOfDeath ? new Date(death.dateOfDeath) : null;
        set("dateOfDeath", dod && !Number.isNaN(dod.getTime()) ? dod.toISOString().slice(0, 10) : "");
        set("placeOfDeath", death.placeOfDeath ?? null);
        set("cause", death.cause ?? "NATURAL_OLD_AGE");
        set("namazDate", nam.date ?? null);
        set("namazTime", nam.time ?? null);
        set("afterNamaz", nam.afterNamaz ?? "JUMMA");
        set("namazPlace", nam.placeName ?? null);
        set("namazStreet", nam.street ?? null);
        set("namazCity", nam.city ?? null);
        set("namazState", nam.state ?? null);
        set("namazCountry", nam.country ?? "Pakistan");
        set("namazMapLink", nam.mapLink ?? null);
        set("burialPlace", bur.placeName ?? null);
        set("burialStreet", bur.street ?? null);
        set("burialCity", bur.city ?? null);
        set("burialState", bur.state ?? null);
        set("burialCountry", bur.country ?? "Pakistan");
        set("burialMapLink", bur.mapLink ?? null);
        set("condStreet", con.street ?? null);
        set("condHouseNo", con.houseNo ?? null);
        set("condCity", con.city ?? null);
        set("condCountry", con.country ?? "Pakistan");
        set("condMapLink", con.mapLink ?? null);
        set("condContactName", con.contactName ?? null);
        set("condContactRelation", con.contactRelation ?? null);
        set("condContactMobile", con.contactMobile ?? null);
        set("condWhatsApp", con.contactWhatsApp ?? null);
        set("condComment", con.comment ?? null);
        set("email", soc.email ?? null);
        set("web", soc.web ?? null);
        set("twitter", soc.twitter ?? null);
        set("facebook", soc.facebook ?? null);
        set("instagram", soc.instagram ?? null);
      })
      .catch(() => {
        if (!cancelled) router.push("/events");
      });
    return () => {
      cancelled = true;
    };
  }, [editId, router, setValue]);

  const titlePrefix = watch("titlePrefix");

  const prefixSel = useSelectFormValue(form, "titlePrefix");
  const maritalSel = useSelectFormValue(form, "maritalStatus");
  const causeSel = useSelectFormValue(form, "cause");
  const namazSel = useSelectFormValue(form, "afterNamaz");

  const onSubmit = async (data: FormData) => {
    const name = [
      titlePrefix && titlePrefix !== "MR" ? PREFIX_LABELS[titlePrefix] ?? "" : "",
      data.firstName,
      data.middleName,
      data.surname,
    ]
      .filter(Boolean)
      .join(" ");
    const title = `In Memoriam — ${name}`;
    const details = {
      part1: {
        title: data.titlePrefix,
        firstName: data.firstName,
        middleName: data.middleName || null,
        surname: data.surname || null,
        nickName: data.nickName || null,
        cast: data.cast || null,
        origin: data.origin || null,
        currentCity: data.currentCity || null,
        maritalStatus: data.maritalStatus,
        age: data.age ? Number(data.age) || null : null,
      },
      family: {
        husbandWife: data.husbandWife || null,
        father: data.father || null,
        mother: data.mother || null,
        grandfather: data.grandfather || null,
        grandmother: data.grandmother || null,
        brothers: data.brothers || null,
        sisters: data.sisters || null,
        son: data.son || null,
        daughter: data.daughter || null,
        inlawFather: data.inlawFather || null,
        inlawMother: data.inlawMother || null,
        inlawBrother: data.inlawBrother || null,
        inlawSister: data.inlawSister || null,
        picture: data.picture || null,
      },
      death: {
        dateOfDeath: data.dateOfDeath,
        placeOfDeath: data.placeOfDeath || null,
        cause: data.cause,
      },
      namaz: {
        date: data.namazDate || null,
        time: data.namazTime || null,
        afterNamaz: data.afterNamaz,
        placeName: data.namazPlace || null,
        street: data.namazStreet || null,
        city: data.namazCity || null,
        state: data.namazState || null,
        country: data.namazCountry || null,
        mapLink: data.namazMapLink || null,
      },
      burial: {
        placeName: data.burialPlace || null,
        street: data.burialStreet || null,
        city: data.burialCity || null,
        state: data.burialState || null,
        country: data.burialCountry || null,
        mapLink: data.burialMapLink || null,
      },
      condolence: {
        street: data.condStreet || null,
        houseNo: data.condHouseNo || null,
        city: data.condCity || null,
        country: data.condCountry || null,
        mapLink: data.condMapLink || null,
        contactName: data.condContactName || null,
        contactRelation: data.condContactRelation || null,
        contactMobile: data.condContactMobile || null,
        contactWhatsApp: data.condWhatsApp || null,
        comment: data.condComment || null,
      },
      social: {
        email: data.email || null,
        web: data.web || null,
        twitter: data.twitter || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
      },
    };

    await submit(editId, {
      title,
      type: "DEATH",
      date: data.dateOfDeath,
      location: data.placeOfDeath || data.condCity || null,
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
        title="Death Record — In Memoriam"
        titleUrdu="وفات کا ریکارڈ — یاد میں"
        description="مرحوم کی مکمل معلومات درج کریں — Janaza, Tadfeen aur Condolence کی تفصیلات سمیت۔ مدعوین کو Digital Card ملے گا۔"
      />
      <div className="mb-4">
        <CancelBackLink href={editId ? `/events/${editId}` : "/events/create"} label="واپس — Back to grid" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Part n={1} title="General" titleUrdu="بنیادی معلومات">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Title"
              labelUrdu="عنوان"
              options={DEATH_TITLE_PREFIXES.map(opt)}
              value={prefixSel.value}
              onValueChange={prefixSel.onValueChange}
            />
            <Field label="First Name (Full Name)" labelUrdu="پہلا نام" error={errors.firstName?.message} required>
              <Input placeholder="e.g. Muhammad" {...register("firstName")} />
            </Field>
            <Field label="Middle Name" labelUrdu="درمیانی نام">
              <Input {...register("middleName")} />
            </Field>
            <Field label="Surname / Maiden Name" labelUrdu="خاندانی نام">
              <Input {...register("surname")} />
            </Field>
            <Field label="Nick Name / Initials" labelUrdu="کنی">
              <Input {...register("nickName")} />
            </Field>
            <Field label="Cast" labelUrdu="قبیلہ">
              <Input {...register("cast")} />
            </Field>
            <Field label="Origin" labelUrdu="تعلقہ علاقہ">
              <Input placeholder="e.g. Miani, Sindh" {...register("origin")} />
            </Field>
            <Field label="Current City" labelUrdu="حالیہ شہر">
              <Input {...register("currentCity")} />
            </Field>
            <SelectField
              label="Marital Status"
              labelUrdu="شادی کی حالت"
              options={MARITAL_STATUSES.map(opt)}
              value={maritalSel.value}
              onValueChange={maritalSel.onValueChange}
            />
            <Field label="Age" labelUrdu="عمر">
              <Input type="number" min={0} max={130} placeholder="e.g. 72" {...register("age")} />
            </Field>
          </div>
        </Part>

        <Part n={2} title="Family References" titleUrdu="خاندانی حوالہ جات">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Husband / Wife" labelUrdu="شوہر / بیوی">
              <Input {...register("husbandWife")} />
            </Field>
            <Field label="Father" labelUrdu="باپ">
              <Input {...register("father")} />
            </Field>
            <Field label="Mother" labelUrdu="ماں">
              <Input {...register("mother")} />
            </Field>
            <Field label="Grandfather" labelUrdu="دادا">
              <Input {...register("grandfather")} />
            </Field>
            <Field label="Grandmother" labelUrdu="دادی">
              <Input {...register("grandmother")} />
            </Field>
            <Field label="Brothers" labelUrdu="بھائی">
              <Input placeholder="نام یا تعداد" {...register("brothers")} />
            </Field>
            <Field label="Sisters" labelUrdu="بہن">
              <Input placeholder="نام یا تعداد" {...register("sisters")} />
            </Field>
            <Field label="Son" labelUrdu="بیٹا">
              <Input placeholder="نام یا تعداد" {...register("son")} />
            </Field>
            <Field label="Daughter" labelUrdu="بیٹی">
              <Input placeholder="نام یا تعداد" {...register("daughter")} />
            </Field>
            <Field label="In-laws — Father" labelUrdu="سسر">
              <Input {...register("inlawFather")} />
            </Field>
            <Field label="In-laws — Mother" labelUrdu="ساس">
              <Input {...register("inlawMother")} />
            </Field>
            <Field label="In-laws — Brother" labelUrdu="ننھا / چچا زرتی">
              <Input {...register("inlawBrother")} />
            </Field>
            <Field label="In-laws — Sister" labelUrdu="ننھی / چچی">
              <Input {...register("inlawSister")} />
            </Field>
            <div className="sm:col-span-2">
              <UploadField label="Picture" labelUrdu="تصویر" value={watch("picture") ?? undefined} onChange={(v) => setValue("picture", v || null, { shouldValidate: true })} />
            </div>
          </div>
        </Part>

        <Part n={3} title="Death Details" titleUrdu="وفات کی تفصیلات">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of Death" labelUrdu="تاریخِ وفات" error={errors.dateOfDeath?.message} required>
              <Input type="date" {...register("dateOfDeath")} />
            </Field>
            <Field label="Place of Death" labelUrdu="جگہِ وفات">
              <Input placeholder="e.g. SHF Hospital, Karachi" {...register("placeOfDeath")} />
            </Field>
            <div className="sm:col-span-2">
              <SelectField
                label="Cause of Death"
                labelUrdu="سببِ وفات"
                options={CAUSE_OF_DEATH_OPTIONS.map(opt)}
                placeholder="سبب منتخب کریں"
                value={causeSel.value}
                onValueChange={causeSel.onValueChange}
                error={errors.cause?.message}
                required
              />
            </div>
          </div>
        </Part>

        <Part n={4} title="Namaz e Janaza" titleUrdu="نمازِ جنازہ">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" labelUrdu="تاریخ">
              <Input type="date" {...register("namazDate")} />
            </Field>
            <Field label="Time" labelUrdu="وقت">
              <Input type="time" {...register("namazTime")} />
            </Field>
            <SelectField
              label="After / Before Namaz"
              labelUrdu="کس نماز کے بعد / پہلے"
              options={NAMAZ_AFTER_OPTIONS.map(opt)}
              value={namazSel.value}
              onValueChange={namazSel.onValueChange}
            />
            <Field label="Place Name (Masjid / Janaza Gah)" labelUrdu="مقام کا نام">
              <Input placeholder="e.g. Jamia Masjid" {...register("namazPlace")} />
            </Field>
            <Field label="Street / Mohalla" labelUrdu="گلی / محلہ">
              <Input {...register("namazStreet")} />
            </Field>
            <Field label="City" labelUrdu="شہر">
              <Input {...register("namazCity")} />
            </Field>
            <Field label="State" labelUrdu="صوبہ">
              <Input placeholder="e.g. Sindh" {...register("namazState")} />
            </Field>
            <Field label="Country" labelUrdu="ملک">
              <Input defaultValue={undefined} {...register("namazCountry")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Google Map Link" labelUrdu="گوگل مپ لنک">
                <Input placeholder="https://maps.google.com/..." {...register("namazMapLink")} />
              </Field>
            </div>
          </div>
        </Part>

        <Part n={5} title="Burial / Tadfeen" titleUrdu="تدفین">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Place Name" labelUrdu="مقام کا نام">
              <Input placeholder="e.g. Bohri Graveyard" {...register("burialPlace")} />
            </Field>
            <Field label="Street" labelUrdu="گلی">
              <Input {...register("burialStreet")} />
            </Field>
            <Field label="City" labelUrdu="شہر">
              <Input {...register("burialCity")} />
            </Field>
            <Field label="State" labelUrdu="صوبہ">
              <Input placeholder="e.g. Sindh" {...register("burialState")} />
            </Field>
            <Field label="Country" labelUrdu="ملک">
              <Input {...register("burialCountry")} />
            </Field>
            <Field label="Google Map Link" labelUrdu="گوگل مپ لنک">
              <Input placeholder="https://maps.google.com/..." {...register("burialMapLink")} />
            </Field>
          </div>
        </Part>

        <Part n={6} title="Condolence Venue & Contact" titleUrdu="تعزیتی محل اور رابطہ">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venue — Street" labelUrdu="گلی">
              <Input {...register("condStreet")} />
            </Field>
            <Field label="House #" labelUrdu="ہاؤس نمبر">
              <Input {...register("condHouseNo")} />
            </Field>
            <Field label="City" labelUrdu="شہر">
              <Input {...register("condCity")} />
            </Field>
            <Field label="Country" labelUrdu="ملک">
              <Input {...register("condCountry")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Google Map Link" labelUrdu="گوگل مپ لنک">
                <Input placeholder="https://maps.google.com/..." {...register("condMapLink")} />
              </Field>
            </div>
            <Field label="Contact — Person Name" labelUrdu="رابطہ کا نام">
              <Input {...register("condContactName")} />
            </Field>
            <Field label="Contact — Relation" labelUrdu="رشتہ">
              <Input placeholder="e.g. Beta" {...register("condContactRelation")} />
            </Field>
            <Field label="Contact — Mobile #" labelUrdu="موبائل نمبر">
              <Input placeholder="03001234567" {...register("condContactMobile")} />
            </Field>
            <Field label="WhatsApp" labelUrdu="واٹس ایپ">
              <Input placeholder="03001234567" {...register("condWhatsApp")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Comment" labelUrdu="تبصرہ">
                <Input placeholder="کوئی خاص ہدایت؟" {...register("condComment")} />
              </Field>
            </div>
          </div>
        </Part>

        <Part n={7} title="Social" titleUrdu="سوشل">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" labelUrdu="ای میل" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>
            <Field label="Web" labelUrdu="ویب سائٹ">
              <Input placeholder="https://..." {...register("web")} />
            </Field>
            <Field label="Twitter" labelUrdu="ٹوئٹر">
              <Input placeholder="@username" {...register("twitter")} />
            </Field>
            <Field label="Facebook" labelUrdu="فیس بک">
              <Input placeholder="facebook.com/..." {...register("facebook")} />
            </Field>
            <Field label="Instagram" labelUrdu="انسٹاگرام">
              <Input placeholder="@username" {...register("instagram")} />
            </Field>
          </div>
        </Part>

        <Part n={8} title="Invite Family (Digital Card)" titleUrdu="خاندان کو مدعو کریں" defaultOpen>
          <p className="mb-3 text-xs text-gray-500">
            مدعو ممبران کو اطلاع ملے گی اور وہ اسے کھول کر <span className="font-medium">Digital Card</span> دیکھ کر اپنا جواب (دعائیں سمیت) بھیج سکیں گے۔
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
