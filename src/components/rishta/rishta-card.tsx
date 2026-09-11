"use client";

import Link from "next/link";
import { MapPin, GraduationCap, Briefcase, ShieldCheck, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

interface RishtaCardProps {
  profile: {
    id: string;
    age: number | null;
    height: string | null;
    education: string | null;
    profession: string | null;
    cityPreference: string | null;
    sect: string | null;
    photos: string[];
    isVerified: boolean;
    viewsCount: number;
    user?: {
      name: string | null;
      image: string | null;
      gender: string | null;
      city: string | null;
    };
  };
}

export function RishtaCard({ profile }: RishtaCardProps) {
  return (
    <Link href={`/rishta/${profile.id}`} className="block">
      <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg">
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-pink-100 to-rose-200">
          {profile.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photos[0]}
              alt="Profile"
              className="blur-photo h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <span className="text-4xl">{profile.user?.gender === "FEMALE" ? "🧕" : "👤"}</span>
              <span className="mt-1 text-xs text-gray-500">Photo available</span>
            </div>
          )}
          {profile.isVerified && (
            <Badge variant="success" className="absolute left-3 top-3">
              <ShieldCheck className="mr-1 h-3 w-3" /> Verified
            </Badge>
          )}
          <Badge className="absolute right-3 top-3 bg-white/90 text-pink-700">
            {profile.user?.gender === "FEMALE" ? "Female" : profile.user?.gender === "MALE" ? "Male" : "Other"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold group-hover:text-pink-700">{profile.user?.name}</h3>
          <div className="mt-2 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span>🎂</span> {profile.age ? `${profile.age} saal` : "عمر نہیں بتائی"}
              {profile.height && <span>· {profile.height}</span>}
            </div>
            {profile.education && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> {profile.education}
              </div>
            )}
            {profile.profession && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> {profile.profession}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {profile.cityPreference || profile.user?.city || "—"}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {profile.viewsCount} views
              </span>
              <span className="font-medium text-pink-600 group-hover:underline">View Profile →</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function avatarInitials(name: string | null) {
  return initials(name);
}
