"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Search, MapPin, ArrowRight, Home } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import type { CommunityItem, ClanItem } from "@/types";

interface CommunityData {
  communities: CommunityItem[];
  myClan: (ClanItem & { community: { name: string } }) | null;
  myClanId: string | null;
}

export default function CommunityPage() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clans?q=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setData(json);
      })
      .catch(() => toast.error("کمیونٹی ڈیٹا لوڈ نہیں ہو سکا"))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  if (loading && !data) {
    return (
      <div>
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Community & Clans" titleUrdu="برادری" description="اپنی کمیونٹی اور کلان سے جڑیں" />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="کمیونٹی یا کلان تلاش کریں..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Communities</TabsTrigger>
          <TabsTrigger value="mine">My Clan</TabsTrigger>
          <TabsTrigger value="clans">Browse Clans</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {data?.communities.length === 0 ? (
            <EmptyState icon={<Users className="h-12 w-12" />} title="کوئی ڈیٹا نہیں ملا" description="کوئی کمیونٹی نہیں ملی" />
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.communities.map((c) => (
                <Card key={c.id} className="transition-all hover:border-emerald-200 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {c.name}{" "}
                          {c.nameUrdu && <span className="font-urdu text-sm text-gray-500">{c.nameUrdu}</span>}
                        </h3>
                        {c.region && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" /> {c.region}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">{c._count?.clans ?? 0} کلانز</Badge>
                    </div>
                    {c.description && <p className="mt-2 line-clamp-2 text-xs text-gray-500">{c.description}</p>}
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-gray-500">
                        <Users className="mr-1 inline h-3.5 w-3.5" />
                        {c.memberCount ?? 0} ممبرز
                      </span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/community/${c.clans?.[0]?.id || ""}`}>
                          Explore <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          {data?.myClan ? (
            <Card className="mt-4">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">🏠</div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {data.myClan.name}{" "}
                      {data.myClan.nameUrdu && (
                        <span className="font-urdu text-sm text-gray-500">{data.myClan.nameUrdu}</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {data.myClan.community.name} · {data.myClan._count?.members ?? 0} ممبرز ·{" "}
                      {data.myClan._count?.subClans ?? 0} ذیلی کلانز
                    </p>
                  </div>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                  <Link href={`/community/${data.myClan.id}`}>کلان پیج کھولیں</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<Home className="h-12 w-12" />}
              title="کوئی ڈیٹا نہیں ملا"
              description="آپ ابھی کسی کلان کے ممبر نہیں ہیں۔ نیچے کلانز براؤز کریں اور جوائن کریں!"
              actionLabel="کلانز براؤز کریں"
            />
          )}
        </TabsContent>

        <TabsContent value="clans">
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.communities.flatMap((c) =>
              (c.clans ?? []).map((clan) => (
                <ClanCard key={clan.id} clan={clan} communityName={c.name} isMyClan={clan.id === data.myClanId} />
              ))
            )}
          </div>
          {data?.communities.every((c) => !c.clans?.length) && (
            <EmptyState
              className="mt-4"
              icon={<Users className="h-12 w-12" />}
              title="کوئی ڈیٹا نہیں ملا"
              description="ابھی کوئی کلان نہیں ہے۔ ایڈمن سے رابطہ کریں۔"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClanCard({
  clan,
  communityName,
  isMyClan,
}: {
  clan: ClanItem;
  communityName: string;
  isMyClan: boolean;
}) {
  return (
    <Card className="transition-all hover:border-emerald-200 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">
              {clan.name}{" "}
              {clan.nameUrdu && <span className="font-urdu text-sm text-gray-500">{clan.nameUrdu}</span>}
            </h3>
            <p className="text-xs text-gray-500">{communityName}</p>
          </div>
          {isMyClan && <Badge variant="success">Aapka Clan</Badge>}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs text-gray-500">
            <Users className="mr-1 inline h-3.5 w-3.5" />
            {clan._count?.members ?? 0} members · {clan._count?.subClans ?? 0} sub-clans
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/community/${clan.id}`}>دیکھیں</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
