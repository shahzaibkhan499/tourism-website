"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Building2, Search, MapPin, Star, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { INDUSTRIES } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import type { BusinessItem } from "@/types";

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [familyOnly, setFamilyOnly] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const debouncedQ = useDebounce(q);
  const debouncedCity = useDebounce(city);

  const fetchBusinesses = useCallback(
    async (cursor?: string, replace = true) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "12" });
        if (debouncedQ) params.set("q", debouncedQ);
        if (industry) params.set("industry", industry);
        if (debouncedCity) params.set("city", debouncedCity);
        if (verifiedOnly) params.set("verified", "true");
        if (familyOnly) params.set("familyOwned", "true");
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/business?${params}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Businesses load nahi ho sake");
          return;
        }
        setBusinesses((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("Network error. Dobara koshish karein.");
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, industry, debouncedCity, verifiedOnly, familyOnly]
  );

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return (
    <div>
      <PageHeader
        title="Business Directory"
        titleUrdu="کاروباری ڈائریکٹری"
        description="Family businesses discover karein"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/business/create">
              <Plus className="mr-1 h-4 w-4" />
              Business Register Karein
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Business dhundein..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sab industries</SelectItem>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative sm:w-44">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="City" className="pl-9" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            variant={verifiedOnly ? "default" : "outline"}
            size="sm"
            className={verifiedOnly ? "bg-emerald-600" : ""}
            onClick={() => setVerifiedOnly(!verifiedOnly)}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified
          </Button>
          <Button
            variant={familyOnly ? "default" : "outline"}
            size="sm"
            className={familyOnly ? "bg-emerald-600" : ""}
            onClick={() => setFamilyOnly(!familyOnly)}
          >
            <Users className="mr-1 h-3.5 w-3.5" /> Family-owned
          </Button>
        </div>
      </div>

      {loading && businesses.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="Koi data nahi mila"
          description="Abhi koi business listed nahi hai. Pehla business register karein!"
          actionLabel="Business Register Karein"
          actionHref="/business/create"
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <Link key={b.id} href={`/business/${b.id}`} className="block">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 text-xl">
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.logo} alt="" className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          "🏢"
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{b.name}</h3>
                        <p className="text-xs text-gray-500">{b.industry}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {b.isVerified && (
                        <Badge variant="success">
                          <ShieldCheck className="mr-0.5 h-3 w-3" /> Verified
                        </Badge>
                      )}
                      {b.isFamilyOwned && (
                        <Badge variant="purple">
                          <Users className="mr-0.5 h-3 w-3" /> Family-owned
                        </Badge>
                      )}
                      {b.isFeatured && <Badge variant="warning">⭐ Featured</Badge>}
                      {b.city && (
                        <Badge variant="secondary">
                          <MapPin className="mr-0.5 h-3 w-3" /> {b.city}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{b.rating ? b.rating.toFixed(1) : "—"}</span>
                        <span className="text-xs text-gray-400">({b.reviewCount ?? 0})</span>
                      </span>
                      <span className="text-xs text-gray-500">{b.jobCount ?? 0} jobs</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination
            hasMore={hasMore}
            isLoading={loading}
            onNext={() => nextCursor && fetchBusinesses(nextCursor, false)}
            onPrev={() => fetchBusinesses(undefined, true)}
          />
        </>
      )}
    </div>
  );
}
