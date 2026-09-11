"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminStats } from "@/components/admin/admin-stats";
import { relativeTimeEn } from "@/lib/utils";

const PIE_COLORS = ["#059669", "#2563eb", "#d97706", "#db2777", "#7c3aed", "#dc2626", "#0891b2", "#65a30d", "#4f46e5", "#ca8a04"];

interface DashboardData {
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
  userGrowth: Array<{ month: string; count: number }>;
  eventsMonthly: Array<{ month: string; count: number }>;
  clanDistribution: Array<{ name: string; members: number }>;
  recentReports: Array<{
    id: string;
    type: string;
    createdAt: string;
    reporter: { name: string | null } | null;
    reported: { name: string | null } | null;
  }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    isVerified: boolean;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setData(json);
      })
      .catch(() => toast.error("ڈیش بورڈ ڈیٹا لوڈ نہیں ہو سکا"))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">پلیٹ فارم کی مکمل صورتِ حال</p>
      </div>

      <AdminStats stats={data.stats} changes={data.changes} />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" name="Users" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events Per Month (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.eventsMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" name="Events" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clan Distribution (members per community)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.clanDistribution}
                  dataKey="members"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => entry.name}
                  fontSize={10}
                >
                  {data.clanDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity (new users)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="count" name="New users" stroke="#059669" fill="#a7f3d0" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Reports (pending)</CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/reports">سب دیکھیں</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentReports.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">Koi pending report nahi hai 🎉</p>
            ) : (
              <div className="space-y-2">
                {data.recentReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {r.reporter?.name || "Unknown"} → {r.reported?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.type} · {relativeTimeEn(r.createdAt)}
                      </div>
                    </div>
                    <Badge variant="destructive">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {u.name || "Unknown"}
                      {u.isVerified && <Badge variant="success" className="ml-2 px-1 py-0 text-[9px]">✓</Badge>}
                    </div>
                    <div className="truncate text-xs text-gray-500">{u.email}</div>
                  </div>
                  <span className="text-xs text-gray-400">{relativeTimeEn(u.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
