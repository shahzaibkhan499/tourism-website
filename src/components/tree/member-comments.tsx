"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CornerUpLeft, Loader2, Pin, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { MemberCommentDto } from "@/types/tree";

// ============================================================
// MEMBER COMMENTS — threaded comments, reactions, pin, edit,
// delete. Loads from /api/tree/[treeId]/comments/[memberId].
// ============================================================

interface MemberCommentsProps {
  treeId: string;
  memberId: string;
}

const EMOJIS = ["❤️", "👍", "😢", "🕊️", "🤲", "😂"];

export function MemberComments({ treeId, memberId }: MemberCommentsProps) {
  const [comments, setComments] = useState<MemberCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tree/${treeId}/comments/${memberId}`);
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Could not load comments — کمنٹس لوڈ نہیں ہوئے");
      setComments(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — کچھ غلط ہو گیا");
    } finally {
      setLoading(false);
    }
  }, [treeId, memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (content: string, parentId: string | null) => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/comments/${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Could not post comment — کمنٹ نہیں جا سکا");
      toast.success(j?.message || "Comment added — کمنٹ شامل ہو گیا");
      if (parentId) {
        setReplyTo(null);
        setReplyText("");
      } else {
        setText("");
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSending(false);
    }
  };

  const react = async (commentId: string, emoji: string) => {
    setBusyId(`${commentId}-${emoji}`);
    try {
      const res = await fetch(`/api/tree/${treeId}/comments/${memberId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, emoji }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Reaction failed — ری ایکشن نہیں ہوا");
      }
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/tree/${treeId}/comments/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: editText }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Could not edit — ایڈٹ نہیں ہو سکا");
      toast.success("Comment updated — کمنٹ اپ ڈیٹ ہو گیا");
      setEditingId(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async (commentId: string) => {
    try {
      const res = await fetch(`/api/tree/${treeId}/comments/${memberId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || "Could not delete — ڈیلیٹ نہیں ہوا");
      toast.success("Comment deleted — کمنٹ ڈیلیٹ ہو گیا");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "کچھ غلط ہو گیا");
    }
  };

  const grouped = (c: MemberCommentDto) => {
    const counts = new Map<string, number>();
    for (const r of c.reactions ?? []) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
    return Array.from(counts.entries());
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={load}>
          دوبارہ کوشش کریں
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {comments.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">Koi data nahi mila — پہلا کمنٹ کریں</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {c.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-sm font-semibold text-gray-800">{c.user?.name ?? "Member — ممبر"}</span>
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  {c.isEdited && " · edited — ترمیم شدہ"}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => remove(c.id)} aria-label="Delete comment">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {editingId === c.id ? (
              <div className="mt-2 flex gap-1">
                <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="h-8 text-sm" />
                <Button size="sm" className="h-8 bg-emerald-600" disabled={savingEdit} onClick={() => saveEdit(c.id)}>
                  {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save — محفوظ"}
                </Button>
              </div>
            ) : (
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={busyId === `${c.id}-${emoji}`}
                  onClick={() => react(c.id, emoji)}
                  className="rounded-full border px-1.5 py-0.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                >
                  {emoji}{" "}
                  {grouped(c).find(([e]) => e === emoji)?.[1] ?? ""}
                </button>
              ))}
              <button
                type="button"
                className="ml-auto text-xs text-emerald-600 hover:underline"
                onClick={() => setEditingId(c.id)}
              >
                ایڈٹ
              </button>
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline"
                onClick={() => {
                  setReplyTo(replyTo === c.id ? null : c.id);
                  setReplyText("");
                }}
              >
                جواب دیں ({c.replies?.length ?? 0})
              </button>
            </div>

            {c.replies?.map((r) => (
              <div key={r.id} className="mt-2 rounded-lg bg-gray-50 p-2 pl-4">
                <div className="flex items-center gap-2">
                  <CornerUpLeft className="h-3 w-3 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-700">{r.user?.name ?? "ممبر"}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-600">{r.content}</p>
              </div>
            ))}

            {replyTo === c.id && (
              <div className="mt-2 flex gap-1">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply… — جواب لکھیں…"
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 bg-emerald-600" disabled={sending} onClick={() => send(replyText, c.id)}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment… — کمنٹ لکھیں…"
          className="h-9 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text, null);
            }
          }}
        />
        <Button size="sm" className="h-9 bg-emerald-600 px-3" disabled={sending} onClick={() => send(text, null)}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
