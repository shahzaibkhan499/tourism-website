"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, PauseCircle, PlayCircle, Trash2, Eye, Lock } from "lucide-react";
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
import { SECTS } from "@/lib/constants";

interface AdminRishta {
  id: string;
  age: number | null;
  education: string | null;
  profession: string | null;
  cityPreference: string | null;
  sect: string | null;
  maritalStatus: string;
  isGuardianMode: boolean;
  isVerified: boolean;
  isActive: boolean;
  isPremium: boolean;
  viewsCount: number;
  photos: string[];
  user: { id: string; name: string | null; email: string; gender: string | null; city: string | null } | null;
}

export default function AdminRishtaPage() {
  const [profiles, setProfiles] = useState<AdminRishta[]>([]);
  const [loading, setLoading] = useState(true);
  const [gender, setGender] = useState("all");
  const [sect, setSect] = useState("all");
  const [verified, setVerified] = useState("all");

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (gender !== "all") params.set("gender", gender);
      if (sect !== "all") params.set("sect", sect);
      if (verified !== "all") params.set("verified", verified);
      const res = await fetch(`/api/admin/rishta?${params}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "پروفائلز لوڈ نہیں ہو سکیں");
      setProfiles(data.profiles);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [gender, sect, verified]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const performAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/rishta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success("کارروائی کامیاب رہی");
      fetchProfiles();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">رشتہ پروفائلز</h1>
        <p className="text-sm text-gray-500">پلیٹ فارم کے تمام رشتہ پروفائلز</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sect} onValueChange={setSect}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sect" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام</SelectItem>
            {SECTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={verified} onValueChange={setVerified}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Verified" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>
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
                  <TableHead>User</TableHead>
                  <TableHead>Age/Gender</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Sect</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-gray-500">
                      کوئی ڈیٹا نہیں ملا
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.user?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{p.user?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {p.age ? `${p.age} saal` : "—"} · {p.user?.gender ? p.user.gender.charAt(0) + p.user.gender.slice(1).toLowerCase() : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{p.education || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.cityPreference || p.user?.city || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.sect || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.isVerified && <Badge variant="success" className="px-1.5 py-0 text-[10px]">✓ Verified</Badge>}
                          {p.isGuardianMode && <Badge variant="info" className="px-1.5 py-0 text-[10px]"><Lock className="mr-0.5 h-2.5 w-2.5" /> Guardian</Badge>}
                          {p.isPremium && <Badge variant="warning" className="px-1.5 py-0 text-[10px]">⭐ Premium</Badge>}
                          {p.photos.length > 0 && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">📷 {p.photos.length}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Eye className="h-3.5 w-3.5" /> {p.viewsCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Suspended</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={p.isVerified ? "Unverify" : "Verify"}
                            onClick={() => performAction(p.id, p.isVerified ? "unverify" : "verify")}
                          >
                            {p.isVerified ? <ShieldOff className="h-4 w-4 text-gray-400" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={p.isActive ? "Suspend" : "Activate"}
                            onClick={() => performAction(p.id, p.isActive ? "suspend" : "activate")}
                          >
                            {p.isActive ? <PauseCircle className="h-4 w-4 text-amber-500" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rishta profile delete karein?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {p.user?.name} ki profile permanently delete ho jayegi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => performAction(p.id, "delete")}>
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
