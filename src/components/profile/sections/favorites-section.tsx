"use client";

import { Star } from "lucide-react";
import { JsonFormSection } from "./json-form-section";
import type { JsonField } from "./json-form-section";

const FIELDS: JsonField[] = [
  { name: "activities", label: "Activities", urdu: "سرگرمیاں" },
  { name: "music", label: "Music", urdu: "موسیقی" },
  { name: "movies", label: "Movies", urdu: "فلمیں" },
  { name: "tvShows", label: "TV Shows", urdu: "ٹی وی شوز" },
  { name: "dramas", label: "Dramas", urdu: "ڈرامے" },
  { name: "books", label: "Books", urdu: "کتابیں" },
  { name: "sports", label: "Sports", urdu: "کھیل" },
  { name: "restaurants", label: "Restaurants", urdu: "ریستوران" },
  { name: "cuisines", label: "Cuisines", urdu: "کھانے" },
  { name: "people", label: "People & Celebrities", urdu: "پسندیدہ شخصیات" },
  { name: "getaways", label: "Getaways", urdu: "سیر و تفریح" },
  { name: "quotes", label: "Quotes", urdu: "اقوال", type: "textarea" },
];

export function FavoritesSection({ profile, onSaved }: { profile: any; onSaved: () => void }) {
  return (
    <JsonFormSection
      icon={Star}
      title="Favorites"
      titleUrdu="پسندیدہ"
      description="آپ کی پسندیدہ چیزیں"
      sectionKey="favorites"
      fields={FIELDS}
      summaryKeys={["sports", "books", "music"]}
      profile={profile}
      onSaved={onSaved}
    />
  );
}
