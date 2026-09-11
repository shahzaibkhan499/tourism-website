"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Download,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Ban,
  CheckCircle2,
  Trash2,
  MoreHorizontal,
  Loader2,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, initials } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  role: string;
  isBanned: boolean;
  isVerified: boolean;
  isActive: boolean;
  city: string | null;
  createdAt: string;
  banReason: string | null;
  clan: { id: string; name: string } | null;
  _count: { events: number; memories: number; reports: number };
}

interface UserDetail extends AdminUser {
  gender: string | null;
  dateOfBirth: string | null;
  province: string | null;
  bio: string | null;
  bloodGroup: string | null;
  occupation: string | null;
  education: string | null;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  subClan: { id: string; name: string } | null;
  rishtaProfile: { id: string; isActive: boolean } | null;
  businesses: Array<{ id: string; name: string }>;
  _count: { events: number; memories: number; media: number; reports: number; reportedBy: number; notifications: number };
}

const roleBadge = (role: string) =>
  role === "ADMIN" ? (
    <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
  ) : role === "MODERATOR" ? (
    <Badge variant="info">Moderator</Badge>
  ) : (
    <Badge variant="secondary">User</Badge>
  );

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [exporting, setExporting] = useState(false);
  const debouncedQ = useDebounce(q);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (role !== "all") params.set("role", role);
      if (status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.status === 403 || data.error === "آپ کو اس کارروائی کی اجازت نہیں ہے") {
        toast.error("ایڈمن رسائی ضروری ہے");
        window.location.href = "/dashboard";
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "صارفین لوڈ نہیں ہو سکے");
        return;
      }
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, role, status, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const performAction = async (userId: string, action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "کارروائی نہیں ہو سکی");
        return;
      }
      toast.success(data.message || "کارروائی کامیاب رہی");
      setBanTarget(null);
      setDeleteTarget(null);
      setDeleteConfirm("");
      fetchUsers();
    } catch {
      toast.error("Network error");
    }
  };

  const viewDetail = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تفصیلات لوڈ نہیں ہو سکیں");
        return;
      }
      setDetailUser(data);
      setDetailOpen(true);
    } catch {
      toast.error("Network error");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const allUsers: AdminUser[] = [];
      for (let p = 1; p <= Math.min(totalPages, 50); p++) {
        const params = new URLSearchParams({ page: String(p) });
        if (debouncedQ) params.set("q", debouncedQ);
        if (role) params.set("role", role);
        if (status) params.set("status", status);
        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        if (!res.ok) break;
        allUsers.push(...data.users);
      }
      const header = "Name,Email,Phone,Role,City,Clan,Verified,Banned,Joined\n";
      const rows = allUsers
        .map((u) =>
          [
            `"${(u.name || "").replace(/"/g, '""')}"`,
            `"${u.email}"`,
            `"${u.phone || ""}"`,
            u.role,
            `"${u.city || ""}"`,
            `"${u.clan?.name || ""}"`,
            u.isVerified ? "Yes" : "No",
            u.isBanned ? "Yes" : "No",
            formatDate(u.createdAt),
          ].join(",")
        )
        .join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${allUsers.length} users export ho gaye`);
    } catch {
      toast.error("ایکسپورٹ ناکام ہو گیا");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-gray-500">{total} total users</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="نام، ای میل یا فون..." className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام کردار</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="MODERATOR">Moderator</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clan</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                      کوئی ڈیٹا نہیں ملا
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.image || undefined} />
                            <AvatarFallback>{initials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{u.name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{u.clan?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{u.city || "—"}</TableCell>
                      <TableCell>
                        {u.isBanned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="success">Active</Badge>}
                      </TableCell>
                      <TableCell>{u.isVerified ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldOff className="h-4 w-4 text-gray-300" />}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewDetail(u.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => performAction(u.id, u.isVerified ? "unverify" : "verify")}>
                              {u.isVerified ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                              {u.isVerified ? "Unverify" : "Verify"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-gray-400">Change Role</DropdownMenuLabel>
                            {(["USER", "MODERATOR", "ADMIN"] as const).map((r) => (
                              <DropdownMenuItem key={r} onClick={() => performAction(u.id, "role", { role: r })} disabled={u.role === r}>
                                <UserCog className="mr-2 h-4 w-4" />
                                {r.charAt(0) + r.slice(1).toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            {u.isBanned ? (
                              <DropdownMenuItem onClick={() => performAction(u.id, "unban")}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Unban
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-amber-600" onClick={() => setBanTarget(u)}>
                                <Ban className="mr-2 h-4 w-4" /> Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(u)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Pichla
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Agla
          </Button>
        </div>
      </div>

      {/* Ban dialog */}
      <AlertDialog open={Boolean(banTarget)} onOpenChange={(o) => !o && setBanTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User ban karein: {banTarget?.name}</AlertDialogTitle>
            <AlertDialogDescription>Ban hone par user login nahi kar sakega.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            placeholder="پابندی کی وجہ لکھیں..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setBanTarget(null); setBanReason(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => banTarget && performAction(banTarget.id, "ban", { reason: banReason })}
            >
              Ban Karein
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User permanently delete karein?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) ka sara data delete ho jayega.
              Confirm karne ke liye <strong>DELETE</strong> type karein.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="DELETE لکھیں"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteTarget(null); setDeleteConfirm(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirm !== "DELETE"}
              onClick={() => deleteTarget && performAction(deleteTarget.id, "delete")}
            >
              Delete Karein
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>{detailUser?.email}</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto sm:grid-cols-2">
              <DetailRow label="Naam" value={detailUser.name || "—"} />
              <DetailRow label="Phone" value={detailUser.phone || "—"} />
              <DetailRow label="Role" value={detailUser.role} />
              <DetailRow label="Gender" value={detailUser.gender || "—"} />
              <DetailRow label="City" value={detailUser.city || "—"} />
              <DetailRow label="Province" value={detailUser.province || "—"} />
              <DetailRow label="Date of Birth" value={detailUser.dateOfBirth ? formatDate(detailUser.dateOfBirth) : "—"} />
              <DetailRow label="Blood Group" value={detailUser.bloodGroup || "—"} />
              <DetailRow label="Occupation" value={detailUser.occupation || "—"} />
              <DetailRow label="Education" value={detailUser.education || "—"} />
              <DetailRow label="Clan" value={detailUser.clan?.name || "—"} />
              <DetailRow label="Sub-Clan" value={detailUser.subClan?.name || "—"} />
              <DetailRow label="2FA" value={detailUser.twoFactorEnabled ? "Enabled" : "Disabled"} />
              <DetailRow label="Last Login" value={detailUser.lastLoginAt ? formatDate(detailUser.lastLoginAt, "dd MMM yyyy, h:mm a") : "کبھی نہیں"} />
              <DetailRow label="Login Count" value={String(detailUser.loginCount)} />
              <DetailRow label="Ban Reason" value={detailUser.banReason || "—"} />
              <DetailRow label="Bio" value={detailUser.bio || "—"} />
              <DetailRow label="Events" value={String(detailUser._count.events)} />
              <DetailRow label="Memories" value={String(detailUser._count.memories)} />
              <DetailRow label="Media" value={String(detailUser._count.media)} />
              <DetailRow label="Reports (by user)" value={String(detailUser._count.reports)} />
              <DetailRow label="Reports (against)" value={String(detailUser._count.reportedBy)} />
              <DetailRow label="رشتہ پروفائل" value={detailUser.rishtaProfile ? (detailUser.rishtaProfile.isActive ? "Active" : "Inactive") : "نہیں ہے"} />
              <DetailRow label="Businesses" value={detailUser.businesses.length ? detailUser.businesses.map((b) => b.name).join(", ") : "—"} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-gray-400">{label}</div>
      <div className="mt-0.5 break-words text-sm text-gray-700">{value}</div>
    </div>
  );
}
