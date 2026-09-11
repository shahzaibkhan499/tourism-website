"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Search, Trash2, Star, StarOff, Users, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVENT_TYPES, getEventTypeInfo } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  isPublic: boolean;
  description: string | null;
  hijriDate: string | null;
  coverImage: string | null;
  creator: { id: string; name: string | null; email: string };
  _count: { rsvps: number };
  createdAt: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [viewEvent, setViewEvent] = useState<AdminEvent | null>(null);
  const debouncedQ = useDebounce(q);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (type !== "all") params.set("type", type);
      const res = await fetch(`/api/admin/events?${params}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ایونٹس لوڈ نہیں ہو سکے");
      setEvents(data.events);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, type]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const performAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success("کارروائی کامیاب رہی");
      fetchEvents();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-gray-500">پلیٹ فارم کے تمام ایونٹس</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Title ya location..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">تمام اقسام</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.emoji} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>RSVPs</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      کوئی ڈیٹا نہیں ملا
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((e) => {
                    const info = getEventTypeInfo(e.type);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="max-w-xs">
                          <div className="truncate font-medium">{e.title}</div>
                          {e.location && <div className="truncate text-xs text-gray-500">{e.location}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {info.emoji} {info.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-600">{formatDate(e.date)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{e.creator.name || e.creator.email}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="h-3.5 w-3.5" /> {e._count.rsvps}
                          </span>
                        </TableCell>
                        <TableCell>
                          {e.isPublic ? <Badge variant="info">Public</Badge> : <Badge variant="secondary">Private</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewEvent(e)} title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={e.isPublic ? "Unfeature" : "Feature"}
                              onClick={() => performAction(e.id, e.isPublic ? "unfeature" : "feature")}
                            >
                              {e.isPublic ? <StarOff className="h-4 w-4 text-gray-400" /> : <Star className="h-4 w-4 text-amber-500" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ایونٹ ڈیلیٹ کریں؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    &quot;{e.title}&quot; اور اس کے تمام RSVPs ڈیلیٹ ہو جائیں گے۔
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => performAction(e.id, "delete")}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(viewEvent)} onOpenChange={(o) => !o && setViewEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewEvent?.title}</DialogTitle>
            <DialogDescription>
              {viewEvent && getEventTypeInfo(viewEvent.type).emoji} {viewEvent && getEventTypeInfo(viewEvent.type).label} ·{" "}
              {viewEvent && formatDate(viewEvent.date)}
            </DialogDescription>
          </DialogHeader>
          {viewEvent && (
            <div className="space-y-3 text-sm">
              {viewEvent.hijriDate && (
                <p>
                  <strong className="text-gray-500">Hijri:</strong> {viewEvent.hijriDate}
                </p>
              )}
              {viewEvent.location && (
                <p>
                  <strong className="text-gray-500">Location:</strong> {viewEvent.location}
                </p>
              )}
              <p>
                <strong className="text-gray-500">Creator:</strong> {viewEvent.creator.name} ({viewEvent.creator.email})
              </p>
              <p>
                <strong className="text-gray-500">RSVPs:</strong> {viewEvent._count.rsvps}
              </p>
              <p>
                <strong className="text-gray-500">Visibility:</strong> {viewEvent.isPublic ? "Public" : "Private"}
              </p>
              {viewEvent.description && (
                <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-600">{viewEvent.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
