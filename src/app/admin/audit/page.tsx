"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface AuditEntry {
  id: string;
  adminId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { id: string; name: string | null } | null;
}

const actionBadge = (action: string) => {
  if (action.includes("DELETE")) return <Badge variant="destructive">{action}</Badge>;
  if (action.includes("CREATE")) return <Badge variant="success">{action}</Badge>;
  if (action.includes("BAN")) return <Badge variant="destructive">{action}</Badge>;
  if (action.includes("UPDATE")) return <Badge variant="info">{action}</Badge>;
  return <Badge variant="secondary">{action}</Badge>;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedAction = useDebounce(action);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (entity) params.set("entity", entity);
      if (debouncedAction) params.set("action", debouncedAction);
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "آڈٹ لاگ لوڈ نہیں ہو سکا");
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [entity, debouncedAction, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-gray-500">ایڈمن کارروائیوں کا مکمل ریکارڈ ({total} entries)</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Entity (e.g. User, Event)"
          className="sm:w-52"
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value);
            setPage(1);
          }}
        />
        <Input
          placeholder="Action (e.g. DELETE)"
          className="sm:w-52"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              <ScrollText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              کوئی آڈٹ اندراج نہیں ہے
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatDate(log.createdAt, "dd MMM yyyy, h:mm:ss a")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.admin?.name || "System"}</TableCell>
                    <TableCell>{actionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{log.entity}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2 font-mono text-xs text-gray-500">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{log.ipAddress || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
