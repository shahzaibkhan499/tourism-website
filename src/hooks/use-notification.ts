"use client";

import { useEffect, useRef, useState } from "react";
import { playChime } from "@/lib/audio";

interface NotificationData {
  unreadCount: number;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
  }>;
}

export function useNotifications(pollIntervalMs = 30000) {
  const [data, setData] = useState<NotificationData>({ unreadCount: 0, notifications: [] });
  const [loading, setLoading] = useState(true);
  const prevUnreadRef = useRef<number | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) return;
      const json = await res.json();
      const unread: number = json.unreadCount ?? 0;
      // chime only when unread count INCREASES (new notification arrived)
      if (prevUnreadRef.current !== null && unread > prevUnreadRef.current) {
        void playChime();
      }
      prevUnreadRef.current = unread;
      setData({
        unreadCount: unread,
        notifications: json.notifications ?? [],
      });
    } catch {
      // silent fail - polling continues
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollIntervalMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIntervalMs]);

  return { ...data, loading, refresh: fetchNotifications };
}
