"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PlayCircle, PauseCircle, Trash2, Users } from "lucide-react";
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
import { JOB_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface AdminJob {
  id: string;
  title: string;
  type: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  isActive: boolean;
  isRemote: boolean;
  deadline: string | null;
  createdAt: string;
  business: { id: string; name: string };
  _count: { applications: number };
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [isActive, setIsActive] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (isActive) params.set("isActive", isActive);
      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "نوکریاں لوڈ نہیں ہو سکیں");
      setJobs(data.jobs);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [type, isActive]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const performAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success("کارروائی کامیاب رہی");
      fetchJobs();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <p className="text-sm text-gray-500">پلیٹ فارم کی تمام نوکریاں</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Job type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام اقسام</SelectItem>
            {JOB_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={isActive} onValueChange={setIsActive}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-gray-500">
                      کوئی ڈیٹا نہیں ملا
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate font-medium">{j.title}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{j.business.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{JOB_TYPES.find((t) => t.value === j.type)?.label || j.type}</Badge>
                        {j.isRemote && <Badge variant="info" className="ml-1 px-1.5 py-0 text-[10px]">Remote</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{j.location || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {j.salaryMin && j.salaryMax ? `${j.currency} ${j.salaryMin.toLocaleString()}+` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-3.5 w-3.5" /> {j._count.applications}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {j.deadline ? formatDate(j.deadline) : "—"}
                      </TableCell>
                      <TableCell>
                        {j.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={j.isActive ? "Deactivate" : "Activate"}
                            onClick={() => performAction(j.id, j.isActive ? "deactivate" : "activate")}
                          >
                            {j.isActive ? <PauseCircle className="h-4 w-4 text-amber-500" /> : <PlayCircle className="h-4 w-4 text-emerald-600" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>جاب ڈیلیٹ کریں؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &quot;{j.title}&quot; اور اس کی درخواستیں ڈیلیٹ ہو جائیں گی۔
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => performAction(j.id, "delete")}>
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
