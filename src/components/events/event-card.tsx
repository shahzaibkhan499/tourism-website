"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventTypeInfo } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: string;
    date: string;
    location: string | null;
    isPublic: boolean;
    coverImage: string | null;
    rsvpCount?: number;
    myRsvp?: string | null;
    creator?: { name: string | null };
    description?: string | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const info = getEventTypeInfo(event.type);
  const eventDate = new Date(event.date);

  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-emerald-100 to-green-200">
          {event.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImage}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">{info.emoji}</div>
          )}
          <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white shadow-md">
            <span className="text-lg font-bold text-emerald-700">{eventDate.getDate()}</span>
            <span className="text-[10px] font-semibold uppercase text-gray-500">
              {eventDate.toLocaleString("en", { month: "short" })}
            </span>
          </div>
          <Badge className="absolute right-3 top-3 bg-white/90 text-emerald-800">
            {info.emoji} {info.label}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-emerald-700">{event.title}</h3>
          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(event.date)} · {eventDate.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {event.rsvpCount ?? 0} log ja rahe hain
              {event.myRsvp === "GOING" && (
                <Badge variant="success" className="ml-auto px-1.5 py-0 text-[10px]">
                  Aap ja rahe hain ✓
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
