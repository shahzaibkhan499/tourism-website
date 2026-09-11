"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Eye, CheckCircle2, XCircle, AlertTriangle, Ban, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { REPORT_TYPES } from "@/lib/constants";
import { relativeTimeEn, formatDate } from "@/lib/utils";

interface AdminReport {
  id: string;
  type: string;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string | null; email: string } | null;
  reported: { id: string; name: string | null; email: string; isBanned: boolean } | null;
}

const statusBadge = (status: string) =>
  status === "PENDING" ? (
    <Badge variant="warning">Pending</Badge>
  ) : status === "REVIEWED" ? (
    <Badge variant="info">Reviewed</Badge>
  ) : status === "RESOLVED" ? (
    <Badge variant="success">Resolved</Badge>
  ) : (
    <Badge variant="secondary">Dismissed</Badge>
  );

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewReport, setViewReport] = useState<AdminReport | null>(null);
  const [actionReport, setActionReport] = useState<AdminReport | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | "warn" | "ban">("resolve");
  const [adminNote, setAdminNote] = useState("");
  const [acting, setActing] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "رپورٹس لوڈ نہیں ہو سکیں");
      setReports(data.reports);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const performAction = async (id: string, action: string, note?: string) => {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote: note }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success("کارروائی کامیاب رہی");
      setActionReport(null);
      setAdminNote("");
      fetchReports();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-gray-500">صارفین کی شکایات اور رپورٹس</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام حالتیں</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVIEWED">Reviewed</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="DISMISSED">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام اقسام</SelectItem>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
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
                  <TableHead>Reporter → Reported</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-500">
                      کوئی ڈیٹا نہیں ملا
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{r.reporter?.name || "Unknown"}</span>
                          <span className="text-gray-400"> → </span>
                          <span className="font-medium">{r.reported?.name || "Unknown"}</span>
                          {r.reported?.isBanned && <Badge variant="destructive" className="ml-1 px-1 py-0 text-[9px]">Banned</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{r.type}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2 text-sm text-gray-500">{r.reason}</span>
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">{relativeTimeEn(r.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="View" onClick={() => setViewReport(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.status === "PENDING" && (
                            <>
                              <Button variant="ghost" size="icon" title="Mark Reviewed" onClick={() => performAction(r.id, "reviewed")}>
                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Resolve"
                                onClick={() => {
                                  setActionReport(r);
                                  setActionType("resolve");
                                  setAdminNote("");
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Dismiss"
                                onClick={() => {
                                  setActionReport(r);
                                  setActionType("dismiss");
                                  setAdminNote("");
                                }}
                              >
                                <XCircle className="h-4 w-4 text-gray-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Warn User"
                                onClick={() => {
                                  setActionReport(r);
                                  setActionType("warn");
                                  setAdminNote("");
                                }}
                              >
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ban User"
                                onClick={() => {
                                  setActionReport(r);
                                  setActionType("ban");
                                  setAdminNote("");
                                }}
                              >
                                <Ban className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
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

      {/* View dialog */}
      <Dialog open={Boolean(viewReport)} onOpenChange={(o) => !o && setViewReport(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {viewReport && `${viewReport.type} · ${formatDate(viewReport.createdAt)}`}
            </DialogDescription>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase text-gray-400">Reporter</div>
                <p className="mt-1 font-medium">{viewReport.reporter?.name}</p>
                <p className="text-gray-500">{viewReport.reporter?.email}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase text-gray-400">Reported User</div>
                <p className="mt-1 font-medium">{viewReport.reported?.name}</p>
                <p className="text-gray-500">{viewReport.reported?.email}</p>
                {viewReport.reported?.isBanned && <Badge variant="destructive" className="mt-1">پہلے سے بند</Badge>}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-400">Reason</div>
                <p className="mt-1 whitespace-pre-wrap text-gray-600">{viewReport.reason}</p>
              </div>
              {viewReport.adminNote && (
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-400">Admin Note</div>
                  <p className="mt-1 text-gray-600">{viewReport.adminNote}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action dialog */}
      <Dialog open={Boolean(actionReport)} onOpenChange={(o) => !o && setActionReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "resolve" && "رپورٹ حل کریں"}
              {actionType === "dismiss" && "رپورٹ مسترد کریں"}
              {actionType === "warn" && "صارف کو وارننگ دیں"}
              {actionType === "ban" && "صارف کو بند کریں"}
            </DialogTitle>
            <DialogDescription>
              {actionReport?.reported?.name} ({actionReport?.reported?.email}) — {actionReport?.type}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder={
              actionType === "ban"
                ? "پابندی کی وجہ لکھیں..."
                : "Admin note (optional)..."
            }
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionReport(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "ban" ? "destructive" : "default"}
              disabled={acting}
              onClick={async () => {
                setActing(true);
                await performAction(actionReport!.id, actionType, adminNote);
                setActing(false);
              }}
            >
              {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
