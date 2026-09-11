"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Check, X, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { relativeTimeEn } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  nameUrdu: string | null;
  region: string | null;
  isActive: boolean;
  clansCount: number;
  membersCount: number;
  clans: Array<{
    id: string;
    name: string;
    nameUrdu: string | null;
    membersCount: number;
    subClansCount: number;
    isActive: boolean;
  }>;
}

interface SubClan {
  id: string;
  name: string;
  nameUrdu: string | null;
  isActive: boolean;
  clan: { id: string; name: string };
  _count: { members: number };
}

interface JoinRequest {
  id: string;
  userId: string;
  userName: string | null;
  clanId: string;
  clanName: string;
  subClanId: string | null;
  subClanName: string | null;
  status: string;
  createdAt: string;
}

export default function AdminClansPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [subClans, setSubClans] = useState<SubClan[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("communities");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createEntity, setCreateEntity] = useState<"community" | "clan" | "subclan">("community");
  const [form, setForm] = useState({ name: "", nameUrdu: "", description: "", region: "", parentId: "" });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteItem, setDeleteItem] = useState<{ entity: string; id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mainRes, subRes, reqRes] = await Promise.all([
        fetch("/api/admin/clans"),
        fetch("/api/admin/clans?tab=subclans"),
        fetch("/api/admin/clans?tab=join-requests"),
      ]);
      const mainData = await mainRes.json();
      const subData = await subRes.json();
      const reqData = await reqRes.json();
      if (!mainRes.ok) return toast.error(mainData.error || "ڈیٹا لوڈ نہیں ہو سکا");
      setCommunities(mainData.communities);
      setSubClans(subData.subClans || []);
      setRequests(reqData.requests || []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allClans = communities.flatMap((c) =>
    c.clans.map((cl) => ({ ...cl, communityName: c.name, communityId: c.id }))
  );

  const openCreate = (entity: "community" | "clan" | "subclan") => {
    setCreateEntity(entity);
    setForm({ name: "", nameUrdu: "", description: "", region: "", parentId: "" });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error("نام لکھیں");
    setSaving(true);
    try {
      const body: Record<string, unknown> = { entity: createEntity, name: form.name, nameUrdu: form.nameUrdu || null };
      if (createEntity === "community") {
        body.region = form.region || null;
        body.description = form.description || null;
      } else if (createEntity === "clan") {
        body.communityId = form.parentId;
        body.description = form.description || null;
        if (!form.parentId) {
          setSaving(false);
          return toast.error("کمیونٹی منتخب کریں");
        }
      } else {
        body.clanId = form.parentId;
        body.description = form.description || null;
        if (!form.parentId) {
          setSaving(false);
          return toast.error("کلان منتخب کریں");
        }
      }
      const res = await fetch("/api/admin/clans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "بنایا نہیں جا سکا");
      toast.success("بنا دیا گیا!");
      setCreateOpen(false);
      fetchData();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await fetch(`/api/admin/clans?entity=${deleteItem.entity}&id=${deleteItem.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ڈیلیٹ نہیں ہو سکا");
      toast.success("ڈیلیٹ ہو گیا");
      setDeleteItem(null);
      fetchData();
    } catch {
      toast.error("Network error");
    }
  };

  const handleRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/clans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "کارروائی نہیں ہو سکی");
      toast.success(`Request ${action === "APPROVE" ? "منظور" : "مسترد"} ہو گئی`);
      fetchData();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clans & Communities</h1>
          <p className="text-sm text-gray-500">کمیونٹیز، کلانز، سب کلانز اور شمولیت کی درخواستیں</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreate("community")}>
            <Plus className="mr-1 h-4 w-4" /> Community
          </Button>
          <Button variant="outline" onClick={() => openCreate("clan")}>
            <Plus className="mr-1 h-4 w-4" /> Clan
          </Button>
          <Button variant="outline" onClick={() => openCreate("subclan")}>
            <Plus className="mr-1 h-4 w-4" /> Sub-Clan
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="clans">Clans</TabsTrigger>
          <TabsTrigger value="subclans">Sub-Clans</TabsTrigger>
          <TabsTrigger value="requests">
            Join Requests{" "}
            {requests.filter((r) => r.status === "PENDING").length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                {requests.filter((r) => r.status === "PENDING").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="communities" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Clans</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communities.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">
                            {c.name} {c.nameUrdu && <span className="font-urdu text-xs text-gray-500">{c.nameUrdu}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{c.region || "—"}</TableCell>
                        <TableCell>{c.clansCount}</TableCell>
                        <TableCell>{c.membersCount}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ entity: "community", id: c.id, name: c.name })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clans" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Community</TableHead>
                      <TableHead>Sub-Clans</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allClans.map((cl) => (
                      <TableRow key={cl.id}>
                        <TableCell>
                          <span className="font-medium">
                            {cl.name} {cl.nameUrdu && <span className="font-urdu text-xs text-gray-500">{cl.nameUrdu}</span>}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{cl.communityName}</TableCell>
                        <TableCell>{cl.subClansCount}</TableCell>
                        <TableCell>{cl.membersCount}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ entity: "clan", id: cl.id, name: cl.name })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subclans" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Clan</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subClans.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <span className="font-medium">
                            {s.name} {s.nameUrdu && <span className="font-urdu text-xs text-gray-500">{s.nameUrdu}</span>}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{s.clan.name}</TableCell>
                        <TableCell>{s._count.members}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ entity: "subclan", id: s.id, name: s.name })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  <Users className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                  کوئی جوائن درخواست نہیں ہے
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Clan</TableHead>
                      <TableHead>Sub-Clan</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.userName || "Unknown"}</TableCell>
                        <TableCell className="text-sm text-gray-600">{r.clanName}</TableCell>
                        <TableCell className="text-sm text-gray-600">{r.subClanName || "—"}</TableCell>
                        <TableCell className="text-sm text-gray-500">{relativeTimeEn(r.createdAt)}</TableCell>
                        <TableCell>
                          {r.status === "PENDING" ? (
                            <Badge variant="warning">Pending</Badge>
                          ) : r.status === "APPROVED" ? (
                            <Badge variant="success">Approved</Badge>
                          ) : (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === "PENDING" ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => handleRequest(r.id, "APPROVE")}>
                                <Check className="mr-0.5 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRequest(r.id, "REJECT")}>
                                <X className="mr-0.5 h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Done</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              نئی {createEntity === "community" ? "کمیونٹی" : createEntity === "clan" ? "کلان" : "ذیلی کلان"} بنائیں
            </DialogTitle>
            <DialogDescription>تفصیلات بھریں اور محفوظ کریں</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Arain" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Urdu Name</Label>
              <Input placeholder="e.g. آرائیں" value={form.nameUrdu} onChange={(e) => setForm({ ...form, nameUrdu: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {createEntity === "community" && (
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input placeholder="e.g. Punjab" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              </div>
            )}
            {createEntity === "clan" && (
              <div className="space-y-1.5">
                <Label>Community *</Label>
                <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="کمیونٹی منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {createEntity === "subclan" && (
              <div className="space-y-1.5">
                <Label>Clan *</Label>
                <Select value={form.parentId} onValueChange={(v) => setForm({ ...form, parentId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="کلان منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {allClans.map((cl) => (
                      <SelectItem key={cl.id} value={cl.id}>
                        {cl.name} ({cl.communityName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              بنائیں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ڈیلیٹ کریں: {deleteItem?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.entity === "community"
                ? "کمیونٹی ڈیلیٹ کرنے سے پہلے اس کے کلانز ڈیلیٹ کرنے ہوں گے۔"
                : "یہ کارروائی واپس نہیں ہو سکتی۔"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
