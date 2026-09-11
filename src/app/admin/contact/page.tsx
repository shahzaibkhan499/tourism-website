"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { relativeTimeEn, formatDate } from "@/lib/utils";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contact?unread=${unreadOnly}`);
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Messages load nahi ho sake");
      setMessages(data.messages);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const toggleRead = async (m: ContactMessage) => {
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, isRead: !m.isRead }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Update nahi ho saka");
      fetchMessages();
      setViewMessage((v) => (v?.id === m.id ? { ...v, isRead: !v.isRead } : v));
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/contact?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Delete nahi ho saka");
      toast.success("Message delete ho gaya");
      fetchMessages();
    } catch {
      toast.error("Network error");
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          <p className="text-sm text-gray-500">
            {messages.length} messages{unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>
        <Button variant={unreadOnly ? "default" : "outline"} onClick={() => setUnreadOnly(!unreadOnly)}>
          {unreadOnly ? "Sab Dekhein" : "Sirf Unread"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            <Mail className="mx-auto mb-2 h-10 w-10 text-gray-300" />
            Koi contact message nahi hai
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className={!m.isRead ? "border-blue-200 bg-blue-50/40" : ""}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <button className="flex-1 text-left" onClick={() => setViewMessage(m)}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-xs text-gray-500">{m.email}</span>
                    {!m.isRead && <Badge variant="info" className="px-1.5 py-0 text-[10px]">New</Badge>}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-gray-700">{m.subject}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{m.message}</p>
                  <span className="mt-1 block text-xs text-gray-400">{relativeTimeEn(m.createdAt)}</span>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" title={m.isRead ? "Mark unread" : "Mark read"} onClick={() => toggleRead(m)}>
                    {m.isRead ? <MailOpen className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-blue-500" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Message delete karein?</AlertDialogTitle>
                        <AlertDialogDescription>Yeh action wapas nahi ho sakta.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(m.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(viewMessage)} onOpenChange={(o) => !o && setViewMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewMessage?.subject}</DialogTitle>
            <DialogDescription>
              {viewMessage?.name} ({viewMessage?.email}) · {viewMessage && formatDate(viewMessage.createdAt, "dd MMM yyyy, h:mm a")}
            </DialogDescription>
          </DialogHeader>
          {viewMessage && (
            <div className="space-y-3">
              <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{viewMessage.message}</p>
              <div className="flex gap-2">
                <a
                  href={`mailto:${viewMessage.email}?subject=Re: ${encodeURIComponent(viewMessage.subject)}`}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Mail className="h-4 w-4" /> Reply Karein
                </a>
                <Button
                  variant="outline"
                  onClick={() => viewMessage && toggleRead(viewMessage)}
                >
                  {viewMessage.isRead ? "Unread Mark Karein" : "Read Mark Karein"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
