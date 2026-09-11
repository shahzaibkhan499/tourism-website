"use client";

import { Users, CalendarDays, Network, Building2, Heart, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalEvents: number;
    totalClans: number;
    totalBusinesses: number;
    totalRishtaProfiles: number;
    pendingReports: number;
  };
  changes: {
    users: number;
    events: number;
    clans: number;
    businesses: number;
    rishtaProfiles: number;
    reports: number;
  };
}

export function AdminStats({ stats, changes }: AdminStatsProps) {
  const cards = [
    { label: "Total Users", value: stats.totalUsers, change: changes.users, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Total Events", value: stats.totalEvents, change: changes.events, icon: CalendarDays, color: "bg-emerald-100 text-emerald-700" },
    { label: "Total Clans", value: stats.totalClans, change: changes.clans, icon: Network, color: "bg-purple-100 text-purple-700" },
    { label: "Businesses", value: stats.totalBusinesses, change: changes.businesses, icon: Building2, color: "bg-amber-100 text-amber-700" },
    { label: "Rishta Profiles", value: stats.totalRishtaProfiles, change: changes.rishtaProfiles, icon: Heart, color: "bg-pink-100 text-pink-700" },
    { label: "Pending Reports", value: stats.pendingReports, change: changes.reports, icon: Flag, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              {c.change > 0 && (
                <Badge variant="success" className="px-1.5 py-0 text-[10px]">
                  +{c.change}
                </Badge>
              )}
            </div>
            <div className="mt-2 text-2xl font-bold">{c.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{c.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
