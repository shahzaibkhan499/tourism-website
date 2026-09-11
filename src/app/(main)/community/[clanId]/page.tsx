"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Users, MapPin, ArrowLeft, Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { JoinRequest } from "@/components/community/join-request";
import type { SubClanItem } from "@/types";
import { formatDate, initials } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface ClanDetail {
  id: string;
  name: string;
  nameUrdu: string | null;
  description: string | null;
  history: string | null;
  community: { id: string; name: string; nameUrdu: string | null; region: string | null };
  subClans: SubClanItem[];
  members: Array<{
    id: string;
    name: string | null;
    image: string | null;
    city: string | null;
    subClan: { id: string; name: string } | null;
    createdAt: string;
  }>;
  _count: { members: number; subClans: number };
}

export default function ClanDetailPage() {
  const params = useParams();
  const clanId = params.clanId as string;
  const [clan, setClan] = useState<ClanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberQuery, setMemberQuery] = useState("");
  const [subClanFilter, setSubClanFilter] = useState("");
  const [myClanId, setMyClanId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(memberQuery);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (debouncedQuery) qs.set("memberQuery", debouncedQuery);
    if (subClanFilter) qs.set("subClan", subClanFilter);

    fetch(`/api/clans/${clanId}?${qs}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setClan(json);
      })
      .catch(() => toast.error("کلان ڈیٹا لوڈ نہیں ہو سکا"))
      .finally(() => setLoading(false));

    fetch("/api/clans")
      .then((r) => r.json())
      .then((d) => setMyClanId(d.myClanId ?? null))
      .catch(() => {});
  }, [clanId, debouncedQuery, subClanFilter]);

  if (loading && !clan) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Clan nahi mila</h2>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/community">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Community par wapas jayen
          </Link>
        </Button>
      </div>
    );
  }

  const isMember = myClanId === clan.id;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/community">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Sab Communities
        </Link>
      </Button>

      {/* Clan banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge className="mb-2 bg-white/20 text-white">
              {clan.community.name} {clan.community.nameUrdu && <span className="font-urdu">({clan.community.nameUrdu})</span>}
            </Badge>
            <h1 className="text-3xl font-bold">
              {clan.name}{" "}
              {clan.nameUrdu && <span className="font-urdu text-2xl text-emerald-100">{clan.nameUrdu}</span>}
            </h1>
            {clan.community.region && (
              <p className="mt-1 flex items-center gap-1 text-sm text-emerald-100">
                <MapPin className="h-4 w-4" /> {clan.community.region}
              </p>
            )}
          </div>
          {!isMember && <JoinRequest clanId={clan.id} clanName={clan.name} subClans={clan.subClans} />}
          {isMember && <Badge variant="success" className="text-sm">Aap member hain ✓</Badge>}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{clan._count.members}</div>
              <div className="text-xs text-gray-500">Total Members</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{clan._count.subClans}</div>
              <div className="text-xs text-gray-500">Sub-Clans</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.max(1, Math.floor(clan._count.members / 4))}</div>
              <div className="text-xs text-gray-500">Families</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Clan ke baare mein</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-gray-600">{clan.description || "کوئی تفصیل نہیں ہے۔"}</p>
            {clan.history && (
              <>
                <h3 className="mt-5 text-sm font-semibold">History</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{clan.history}</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sub-clans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sub-Clans</CardTitle>
          </CardHeader>
          <CardContent>
            {clan.subClans.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">Koi sub-clan nahi hai</p>
            ) : (
              <div className="space-y-2">
                {clan.subClans.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubClanFilter(subClanFilter === s.id ? "" : s.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      subClanFilter === s.id ? "border-emerald-300 bg-emerald-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {s.name} {s.nameUrdu && <span className="font-urdu text-xs text-gray-500">{s.nameUrdu}</span>}
                    </span>
                    <Badge variant="secondary">{s._count?.members ?? 0} members</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members directory */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Members Directory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="نام یا شہر سے تلاش کریں..."
              className="pl-9"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {clan.members.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">کوئی ڈیٹا نہیں ملا</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clan.members.map((m) => (
                <Link
                  key={m.id}
                  href={`/profile/${m.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition-all hover:border-emerald-200 hover:shadow-sm"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.image || undefined} />
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.name}</div>
                    <div className="truncate text-xs text-gray-500">
                      {m.city || "—"}
                      {m.subClan ? ` · ${m.subClan.name}` : ""} · Joined {formatDate(m.createdAt, "MMM yyyy")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
