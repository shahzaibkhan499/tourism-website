"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// TREE STATS PANEL — Step 36: counts, demographics, charts
// (generations, gender, cities, occupations, birth decades,
// marriage statuses, average lifespan).
// ============================================================

interface TreeStatsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
}

interface StatsDto {
  totals: {
    members: number;
    males: number;
    females: number;
    living: number;
    deceased: number;
    generations: number;
    relationships: number;
    marriages: number;
    comments: number;
    lifeEvents: number;
    stories: number;
    photos: number;
    collaborators: number;
  };
  generationHistogram: { generation: number; count: number }[];
  genderByGeneration: { generation: number; male: number; female: number }[];
  topCities: { city: string; count: number }[];
  topOccupations: { occupation: string; count: number }[];
  birthDecades: { decade: string; count: number }[];
  marriageByStatus: { status: string; count: number }[];
  averageLifespan: number | null;
}

const PIE_COLORS = ["#3b82f6", "#ec4899", "#9ca3af", "#16a34a", "#f59e0b", "#8b5cf6"];
const STATUS_URDU: Record<string, string> = {
  MARRIED: "شادی شدہ",
  DIVORCED: "طلاق",
  WIDOWED: "بیوہ/بیوہ ہوئی",
  SEPARATED: "علیحدہ",
  ENGAGED: "منگنی",
};

export function TreeStatsPanel({ open, onOpenChange, treeId }: TreeStatsPanelProps) {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/tree/${treeId}/stats`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setStats(j);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "کچھ غلط ہو گیا"))
      .finally(() => setLoading(false));
  }, [open, treeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>شجرے کے اعداد و شمار — Statistics</DialogTitle>
          <DialogDescription>ممبرز، نسلیں، شہر، پیشے اور مزید</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => onOpenChange(false)}>
              بند کریں
            </Button>
          </div>
        ) : !stats ? (
          <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila</p>
        ) : (
          <div className="space-y-5">
            {/* totals */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatBox label="کل ممبرز" value={stats.totals.members} />
              <StatBox label="مرد" value={stats.totals.males} />
              <StatBox label="Females — خواتین" value={stats.totals.females} />
              <StatBox label="نسلیں" value={stats.totals.generations} />
              <StatBox label="زندہ" value={stats.totals.living} />
              <StatBox label="فوت شدہ" value={stats.totals.deceased} />
              <StatBox label="Relationships — رشتے" value={stats.totals.relationships} />
              <StatBox label="شادیاں" value={stats.totals.marriages} />
              <StatBox label="کمنٹس" value={stats.totals.comments} />
              <StatBox label="واقعات" value={stats.totals.lifeEvents} />
              <StatBox label="کہانیاں" value={stats.totals.stories} />
              <StatBox label="Photos — تصاویر" value={stats.totals.photos} />
            </div>

            {stats.averageLifespan !== null && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                اوسط عمر: <span className="font-bold">{stats.averageLifespan} سال</span>
              </p>
            )}

            {/* generations bar */}
            <ChartCard title="نسلیں — Generations">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.generationHistogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="ممبرز" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* gender by generation */}
            <ChartCard title="Gender by Generation — جنس بلحاظ نسل">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.genderByGeneration}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" name="مرد" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="female" name="خواتین" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* gender pie */}
            <ChartCard title="Gender Ratio — جنس کا تناسب">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "مرد", value: stats.totals.males },
                      { name: "خواتین", value: stats.totals.females },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* marriage status */}
            <ChartCard title="شادیوں کی حیثیت — Marriage Status">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.marriageByStatus.filter((m) => m.count > 0).map((m) => ({
                      name: STATUS_URDU[m.status] ?? m.status,
                      value: m.count,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.marriageByStatus
                      .filter((m) => m.count > 0)
                      .map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* birth decades */}
            <ChartCard title="پیدائش بلحاظ دہائی — Birth Decades">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.birthDecades}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="پیدائش" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* top cities + occupations */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ChartCard title="Top Cities — بڑے شہر">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topCities} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="city" width={90} />
                    <Tooltip />
                    <Bar dataKey="count" name="ممبرز" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Top Occupations — اہم پیشے">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.topOccupations} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="occupation" width={90} />
                    <Tooltip />
                    <Bar dataKey="count" name="ممبرز" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-center">
      <p className="text-lg font-bold text-gray-800">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="mb-2 text-sm font-semibold text-gray-700">{title}</p>
      {children}
    </div>
  );
}
