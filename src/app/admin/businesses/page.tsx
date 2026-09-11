"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Star, StarOff, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INDUSTRIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface AdminBusiness {
  id: string;
  name: string;
  industry: string | null;
  city: string | null;
  logo: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  isFamilyOwned: boolean;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  _count: { jobPostings: number; reviews: number };
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [verified, setVerified] = useState("");

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (industry) params.set("industry", industry);
      if (city) params.set("city", city);
      if (verified) params.set("verified", verified);
      const res = await fetch(`/api/admin/businesses?${params}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Businesses load nahi ho sake");
      setBusinesses(data.businesses);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [industry, city, verified]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const performAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Action nahi ho saka");
      toast.success("Action kamyab raha");
      fetchBusinesses();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <p className="text-sm text-gray-500">Directory ke tamam businesses</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-full sm:w-52">
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
        <Select value={verified} onValueChange={setVerified}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Verified" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sab</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setIndustry(""); setCity(""); setVerified(""); }}>
          Filters Clear Karein
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-500">
                      Koi data nahi mila
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-sm">
                            {b.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.logo} alt="" className="h-full w-full rounded-lg object-cover" />
                            ) : (
                              "🏢"
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{b.name}</div>
                            <div className="text-xs text-gray-500">
                              {b.industry || "—"} · {formatDate(b.createdAt)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{b.user.name || b.user.email}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.city || "—"}</TableCell>
                      <TableCell>{b._count.jobPostings}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {b.isVerified && <Badge variant="success" className="px-1.5 py-0 text-[10px]">✓ Verified</Badge>}
                          {b.isFeatured && <Badge variant="warning" className="px-1.5 py-0 text-[10px]">⭐ Featured</Badge>}
                          {b.isFamilyOwned && <Badge variant="purple" className="px-1.5 py-0 text-[10px]">Family</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Suspended</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={b.isVerified ? "Unverify" : "Verify"}
                            onClick={() => performAction(b.id, b.isVerified ? "unverify" : "verify")}
                          >
                            {b.isVerified ? <ShieldOff className="h-4 w-4 text-gray-400" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={b.isFeatured ? "Unfeature" : "Feature"}
                            onClick={() => performAction(b.id, b.isFeatured ? "unfeature" : "feature")}
                          >
                            {b.isFeatured ? <StarOff className="h-4 w-4 text-gray-400" /> : <Star className="h-4 w-4 text-amber-500" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={b.isActive ? "Suspend" : "Activate"}
                            onClick={() => performAction(b.id, b.isActive ? "suspend" : "activate")}
                          >
                            {b.isActive ? <PauseCircle className="h-4 w-4 text-amber-500" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Business delete karein?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{b.name}&quot; aur is ki jobs/reviews permanently delete ho jayengi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => performAction(b.id, "delete")}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
