"use client";

import { Phone } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  // Residence
  { name: "residence.mohalla", label: "Residence — Mohalla/Block/Colony", urdu: "رہائش — محلہ/بلاک" },
  { name: "residence.unit", label: "Residence — Apartment/House/Unit", urdu: "رہائش — فلیٹ/گھر" },
  { name: "residence.street", label: "Residence — Street #", urdu: "رہائش — گلی نمبر" },
  { name: "residence.sector", label: "Residence — Sector", urdu: "رہائش — سیکٹر" },
  { name: "residence.city", label: "Residence — City", urdu: "رہائش — شہر" },
  { name: "residence.state", label: "Residence — State/Province", urdu: "رہائش — صوبہ" },
  { name: "residence.country", label: "Residence — Country", urdu: "رہائش — ملک" },
  { name: "residence.zipCode", label: "Residence — Zip Code", urdu: "رہائش — زپ کوڈ" },
  { name: "residence.phone", label: "Residence — Phone #", urdu: "رہائش — فون" },
  { name: "residence.mobile", label: "Residence — Mobile #", urdu: "رہائش — موبائل" },
  { name: "residence.emergencyContact", label: "Residence — Emergency Contact", urdu: "رہائش — ہنگامی رابطہ" },
  { name: "residence.permanentAddress", label: "Permanent Address", urdu: "مستقل پتہ" },
  { name: "residence.googleMap", label: "Residence — Google Map", urdu: "رہائش — گوگل میپ" },
  // Office
  { name: "office.street", label: "Office — Street/Mohalla", urdu: "دفتر — گلی/محلہ" },
  { name: "office.unit", label: "Office — Shop/Office/Building", urdu: "دفتر — دکان/عمارت" },
  { name: "office.city", label: "Office — City", urdu: "دفتر — شہر" },
  { name: "office.state", label: "Office — State/Province", urdu: "دفتر — صوبہ" },
  { name: "office.country", label: "Office — Country", urdu: "دفتر — ملک" },
  { name: "office.zipCode", label: "Office — Zip Code", urdu: "دفتر — زپ کوڈ" },
  { name: "office.phone", label: "Office — Phone #", urdu: "دفتر — فون" },
  { name: "office.mobile", label: "Office — Mobile #", urdu: "دفتر — موبائل" },
  { name: "office.emergencyContact", label: "Office — Emergency Contact", urdu: "دفتر — ہنگامی رابطہ" },
  { name: "office.googleMap", label: "Office — Google Map", urdu: "دفتر — گوگل میپ" },
  // Social
  { name: "social.email", label: "Social — Email", urdu: "ای میل" },
  { name: "social.web", label: "Social — Web", urdu: "ویب سائٹ" },
  { name: "social.twitter", label: "Social — Twitter", urdu: "ٹوئٹر" },
  { name: "social.facebook", label: "Social — Facebook", urdu: "فیس بک" },
  { name: "social.whatsapp", label: "Social — WhatsApp", urdu: "واٹس ایپ" },
  { name: "social.instagram", label: "Social — Instagram", urdu: "انسٹاگرام" },
];

export function ContactSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={Phone}
      title="Contact"
      titleUrdu="رابطہ"
      description="رہائشی پتہ، دفتر اور سوشل رابطے"
      sectionKey="contact"
      fields={FIELDS}
      summaryKeys={["residence.city", "residence.mobile", "social.whatsapp"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
