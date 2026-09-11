"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* eslint-disable @typescript-eslint/no-explicit-any */

function SectionTitle({ en, ur }: { en: string; ur: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b pb-1.5 pt-3 first:pt-0">
      <h3 className="text-sm font-bold uppercase tracking-wide text-pink-700">{en}</h3>
      <span dir="rtl" className="font-urdu text-sm text-pink-600">{ur}</span>
    </div>
  );
}

function Field({
  label,
  urdu,
  register,
  errors,
  path,
  placeholder,
  type,
  textarea,
}: any) {
  return (
    <div className="space-y-1.5">
      <Label className="flex flex-wrap items-baseline gap-x-2">
        <span>{label}</span>
        <span dir="rtl" className="font-urdu text-xs text-gray-500">{urdu}</span>
      </Label>
      {textarea ? (
        <Textarea rows={2} placeholder={placeholder} {...register(path)} />
      ) : (
        <Input type={type ?? "text"} placeholder={placeholder} {...register(path)} />
      )}
      {errors?.[path] && <p className="text-xs text-red-600">{String(errors[path].message ?? "غلط")}</p>}
    </div>
  );
}

function SelectField({ label, urdu, path, options, watch, setValue }: any) {
  const value = watch(path);
  return (
    <div className="space-y-1.5">
      <Label className="flex flex-wrap items-baseline gap-x-2">
        <span>{label}</span>
        <span dir="rtl" className="font-urdu text-xs text-gray-500">{urdu}</span>
      </Label>
      <Select onValueChange={(v) => setValue(path, v)} value={value || undefined}>
        <SelectTrigger>
          <SelectValue placeholder="منتخب کریں" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o: string) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const YES_NO = ["Yes", "No"];

export function MarriageFormStep({ register, watch, setValue, errors }: any) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 text-sm text-pink-800">
        <span dir="rtl" className="font-urdu font-semibold">🌹 خواجگان میرج فارم 🌹</span>
        <p className="mt-1 text-xs text-pink-600">
          یہ تفصیلی فارم رشتے کی بہتر مماثلت کے لیے ہے۔ صرف وہی معلومات دکھائی جائیں گی جن کی آپ اجازت دیں گے۔
        </p>
      </div>

      <SectionTitle en="Personal Information" ur="ذاتی معلومات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Gender"
          urdu="جنس"
          path="marriageForm.personal.gender"
          options={["Male", "Female"]}
          watch={watch}
          setValue={setValue}
        />
        <Field label="Mother Tongue" urdu="مادری زبان" path="marriageForm.personal.motherTongue" register={register} errors={errors} placeholder="اردو، پنجابی..." />
        <Field label="Children (If Have)" urdu="اولاد (اگر ہے)" path="marriageForm.personal.childrenInfo" register={register} errors={errors} />
      </div>

      <SectionTitle en="Physical Appearance" ur="جسمانی حالت" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Height" urdu="قد" path="marriageForm.physical.height" register={register} errors={errors} placeholder={"e.g. 5'7\""} />
        <Field label="Weight" urdu="وزن" path="marriageForm.physical.weight" register={register} errors={errors} placeholder="e.g. 65 kg" />
        <Field label="Complexion (Slim/Medium/Healthy)" urdu="رنگت" path="marriageForm.physical.complexion" register={register} errors={errors} />
        <SelectField label="Disability (Yes/No)" urdu="معذوری (جی ہاں/نہیں)" path="marriageForm.physical.disability" options={YES_NO} watch={watch} setValue={setValue} />
      </div>

      <SectionTitle en="Education Details" ur="تعلیم کی تفصیلات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qualification" urdu="قابلیت" path="marriageForm.education.qualification" register={register} errors={errors} />
        <Field label="School" urdu="اسکول" path="marriageForm.education.school" register={register} errors={errors} />
        <Field label="College" urdu="کالج" path="marriageForm.education.college" register={register} errors={errors} />
        <Field label="University" urdu="یونیورسٹی" path="marriageForm.education.university" register={register} errors={errors} />
        <Field label="Course / Diploma" urdu="کورس / ڈپلومہ" path="marriageForm.education.courseDiploma" register={register} errors={errors} />
      </div>

      <SectionTitle en="Job / Business" ur="نوکری / کاروبار" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company / Business Name" urdu="کمپنی / بزنس کا نام" path="marriageForm.job.companyBusiness" register={register} errors={errors} />
        <Field label="Nature of Job / Business" urdu="نوکری / بزنس کی نوعیت" path="marriageForm.job.natureJobBusiness" register={register} errors={errors} />
        <Field label="Place of Work" urdu="کام کی جگہ" path="marriageForm.job.placeOfWork" register={register} errors={errors} />
        <Field label="Rank / Position" urdu="عہدہ / درجہ" path="marriageForm.job.rankPosition" register={register} errors={errors} />
        <Field label="Monthly Income" urdu="ماہانہ آمدنی" path="marriageForm.job.monthlyIncome" register={register} errors={errors} />
        <Field label="Future Plans" urdu="مستقبل کے منصوبے" path="marriageForm.job.futurePlans" register={register} errors={errors} />
      </div>

      <SectionTitle en="Cultural & Ethnic Preferences" ur="ثقافتی اور نسلی ترجیحات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Languages Spoken" urdu="زبانیں" path="marriageForm.cultural.languagesSpoken" register={register} errors={errors} />
        <Field label="Caste (Khawaja/Shaikh/Bhatti)" urdu="ذات" path="marriageForm.cultural.caste" register={register} errors={errors} />
        <Field label="Sub Cast / Ethnicity (Vohra/Sehgal/Mehta/Roar)" urdu="ذیلی ذات / نسل" path="marriageForm.cultural.subCast" register={register} errors={errors} />
        <Field label="Hobbies / Interests" urdu="مشاغل / دلچسپیاں" path="marriageForm.cultural.hobbies" register={register} errors={errors} />
      </div>

      <SectionTitle en="Religion Details" ur="مذہب کی تفصیلات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Religion" urdu="مذہب" path="marriageForm.religion.religion" register={register} errors={errors} placeholder="Islam" />
        <SelectField
          label="Sect (Maslak) (Sunni/Shia)"
          urdu="مسلک (سنی/شیعہ)"
          path="marriageForm.religion.sect"
          options={["Sunni", "Shia"]}
          watch={watch}
          setValue={setValue}
        />
      </div>

      <SectionTitle en="House Details" ur="گھر کی تفصیلات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Home (Own/Rent)" urdu="گھر (اپنا/کرایہ)" path="marriageForm.house.homeOwnership" options={["Own", "Rent"]} watch={watch} setValue={setValue} />
        <Field label="Size" urdu="سائز" path="marriageForm.house.homeSize" register={register} errors={errors} />
        <Field label="Location" urdu="مقام" path="marriageForm.house.homeLocation" register={register} errors={errors} />
        <SelectField label="Land (Yes/No)" urdu="زمین (جی ہاں/نہیں)" path="marriageForm.house.land" options={YES_NO} watch={watch} setValue={setValue} />
        <Field label="Vehicles" urdu="گاڑیاں" path="marriageForm.house.vehicles" register={register} errors={errors} />
        <Field label="Address" urdu="پتہ" path="marriageForm.house.address" register={register} errors={errors} />
        <Field label="Current City" urdu="موجودہ شہر" path="marriageForm.house.currentCity" register={register} errors={errors} />
        <Field label="Nationality" urdu="قومیت" path="marriageForm.house.nationality" register={register} errors={errors} />
        <Field label="Home Town (Miani/Bhera/Pind Dadan Khan)" urdu="آبائی شہر" path="marriageForm.house.homeTown" register={register} errors={errors} />
      </div>

      <SectionTitle en="Family Details" ur="خاندان کی تفصیلات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Father Name" urdu="والد کا نام" path="marriageForm.family.fatherName" register={register} errors={errors} />
        <Field label="Father's Occupation" urdu="والد کا پیشہ" path="marriageForm.family.fatherOccupation" register={register} errors={errors} />
        <Field label="Father Mobile No." urdu="والد کا موبائل نمبر" path="marriageForm.family.fatherMobile" register={register} errors={errors} />
        <Field label="Mother Name" urdu="والدہ کا نام" path="marriageForm.family.motherName" register={register} errors={errors} />
        <Field label="Mother's Occupation" urdu="والدہ کا پیشہ" path="marriageForm.family.motherOccupation" register={register} errors={errors} />
        <Field label="Mother Mobile No." urdu="والدہ کا موبائل نمبر" path="marriageForm.family.motherMobile" register={register} errors={errors} />
        <Field label="Brothers" urdu="بھائی" path="marriageForm.family.brothers" register={register} errors={errors} />
        <Field label="Brothers Married" urdu="شادی شدہ بھائی" path="marriageForm.family.brothersMarried" register={register} errors={errors} />
        <Field label="Sisters" urdu="بہنیں" path="marriageForm.family.sisters" register={register} errors={errors} />
        <Field label="Sisters Married" urdu="شادی شدہ بہنیں" path="marriageForm.family.sistersMarried" register={register} errors={errors} />
      </div>

      <SectionTitle en="Life Partner Requirements" ur="زندگی کے ساتھی کی ضروریات" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Single / Divorced" urdu="غیر شادی شدہ / طلاق یافتہ" path="marriageForm.partner.maritalStatus" options={["Single", "Divorced"]} watch={watch} setValue={setValue} />
        <Field label="Age Between" urdu="عمر کے درمیان" path="marriageForm.partner.ageBetween" register={register} errors={errors} placeholder="e.g. 25-30" />
        <Field label="Height" urdu="قد" path="marriageForm.partner.height" register={register} errors={errors} />
        <Field label="City" urdu="شہر" path="marriageForm.partner.city" register={register} errors={errors} />
        <Field label="Caste" urdu="ذات" path="marriageForm.partner.caste" register={register} errors={errors} />
        <SelectField label="Sect (Maslak) (Sunni/Shia)" urdu="مسلک" path="marriageForm.partner.sect" options={["Sunni", "Shia"]} watch={watch} setValue={setValue} />
        <Field label="Qualification" urdu="قابلیت" path="marriageForm.partner.qualification" register={register} errors={errors} />
        <Field label="Any Other" urdu="کوئی اور" path="marriageForm.partner.anyOther" register={register} errors={errors} />
        <Field label="If Divorced" urdu="اگر طلاق یافتہ" path="marriageForm.partner.ifDivorced" register={register} errors={errors} />
        <SelectField label="Sharia Perda (Yes/No)" urdu="شریعت پردہ (جی ہاں/نہیں)" path="marriageForm.partner.shariaPerda" options={YES_NO} watch={watch} setValue={setValue} />
      </div>

      <SectionTitle en="Contact" ur="رابطہ" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Person Name" urdu="رابطہ شخص کا نام" path="marriageForm.contact.personName" register={register} errors={errors} />
        <Field label="Relation" urdu="رشتہ" path="marriageForm.contact.relation" register={register} errors={errors} />
        <Field label="Mobile No" urdu="موبائل نمبر" path="marriageForm.contact.mobile" register={register} errors={errors} placeholder="03001234567" />
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-emerald-600"
            {...register("marriageForm.oathAccepted")}
          />
          <span className="text-sm text-emerald-900">
            <span dir="rtl" className="font-urdu font-semibold">حلف نامہ — </span>
            میں اللہ تعالیٰﷻ کو گواہ بنا کر اس بات کا اقرار کرتا/کرتی ہوں کہ میں فراڈ نہیں ہوں اور پوری ایمانداری سے یہ فارم
            فل کر کے بھیجا ہے۔ ان شاء اللہ تعالیٰ۔
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <span dir="rtl" className="font-urdu">نوٹ: 🖼️ لڑکے/لڑکی کی 1 تصویر اور مکمل فیملی کی 1 تصویر بھیجیں۔ ہم آپ کی ضرورت کے
        مطابق بہترین رشتہ دکھانے کی کوشش کریں گے۔</span>
      </div>
    </div>
  );
}
