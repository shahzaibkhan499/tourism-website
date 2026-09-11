"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, Inbox, Loader2, Send, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, initials } from "@/lib/utils";

interface RequestUser {
  id: string;
  name: string | null;
  image: string | null;
  gender: string;
  city: string | null;
}

interface RishtaRequestRow {
  id: string;
  message: string | null;
  status: string;
  createdAt: string;
  sender?: RequestUser;
  receiver?: RequestUser;
}

const STATUS_BADGES: Record<string, { variant: "success" | "destructive" | "warning" | "secondary"; label: string }> = {
  PENDING: { variant: "warning", label: "Pending" },
  ACCEPTED: { variant: "success", label: "Accepted" },
  REJECTED: { variant: "destructive", label: "Rejected" },
  BLOCKED: { variant: "destructive", label: "Blocked" },
};

export function RequestsInbox() {
  const [received, setReceived] = useState<RishtaRequestRow[]>([]);
  const [sent, setSent] = useState<RishtaRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/rishta/request")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          toast.error(json.error);
          return;
        }
        setReceived(json.received || []);
        setSent(json.sent || []);
      })
      .catch(() => toast.error("Requests load nahi hui"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (requestId: string, action: "ACCEPTED" | "REJECTED") => {
    setActingId(requestId);
    try {
      const res = await fetch("/api/rishta/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Action nahi ho saka");
        return;
      }
      toast.success(action === "ACCEPTED" ? "Request qabool ho gayi! 🎉" : "Request reject kar di gayi");
      setReceived((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: action } : r)));
    } catch {
      toast.error("Network error. Dobara koshish karein.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Incoming requests */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Inbox className="h-5 w-5 text-pink-600" />
          Aayi hui Requests
          {received.filter((r) => r.status === "PENDING").length > 0 && (
            <Badge variant="destructive">{received.filter((r) => r.status === "PENDING").length} nayi</Badge>
          )}
        </h2>
        {received.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-10 w-10" />}
            title="Koi data nahi mila"
            description="Abhi aapko koi rishta request nahi aayi. Apna profile active rakhein."
            actionLabel="Profiles Dekhein"
            actionHref="/rishta"
          />
        ) : (
          <div className="space-y-3">
            {received.map((r) => {
              const s = r.sender;
              const badge = STATUS_BADGES[r.status] || STATUS_BADGES.PENDING;
              return (
                <Card key={r.id}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={s?.image || undefined} />
                        <AvatarFallback>{initials(s?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{s?.name || "Unknown"}</span>
                          <Badge variant={badge.variant as never}>{badge.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {s?.gender === "FEMALE" ? "Female" : "Male"}
                          {s?.city ? ` · ${s.city}` : ""} · {formatDate(r.createdAt)}
                        </p>
                        {r.message && <p className="mt-1.5 text-sm text-gray-700">&ldquo;{r.message}&rdquo;</p>}
                      </div>
                    </div>
                    {r.status === "PENDING" ? (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={actingId === r.id}
                          onClick={() => respond(r.id, "ACCEPTED")}
                        >
                          {actingId === r.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1 h-3.5 w-3.5" />}
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" disabled={actingId === r.id} onClick={() => respond(r.id, "REJECTED")}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/rishta/${s?.id}`}>Profile Dekhein</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Sent requests */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Send className="h-5 w-5 text-pink-600" />
          Bheji hui Requests
        </h2>
        {sent.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
            Aapne abhi tak koi rishta request nahi bheji
          </p>
        ) : (
          <div className="space-y-3">
            {sent.map((r) => {
              const s = r.receiver;
              const badge = STATUS_BADGES[r.status] || STATUS_BADGES.PENDING;
              return (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={s?.image || undefined} />
                        <AvatarFallback>{initials(s?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{s?.name || "Unknown"}</span>
                          <Badge variant={badge.variant as never}>{badge.label}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {s?.city ? `${s.city} · ` : ""}
                          {formatDate(r.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/rishta/${s?.id}`}>Profile Dekhein</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
