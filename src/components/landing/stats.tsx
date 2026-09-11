"use client";

import { useEffect, useRef, useState } from "react";

interface PublicStats {
  users: number;
  events: number;
  clans: number;
  memories: number;
  businesses: number;
  rishtaProfiles: number;
}

function useCountUp(target: number, start: boolean, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, duration]);
  return value;
}

function StatItem({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useCountUp(value, start);
  return (
    <div className="flex flex-col items-center py-8">
      <span className="text-4xl font-extrabold text-white sm:text-5xl">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="mt-1 text-sm font-medium text-emerald-100">{label}</span>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PublicStats | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/public/communities")
      .then((res) => res.json())
      .then((json) => {
        if (json.stats) setData(json.stats as PublicStats);
      })
      .catch(() => {
        // Stats section stays empty on network failure
      });
  }, []);

  const stats = data
    ? [
        { value: data.users, suffix: "+", label: "Families" },
        { value: data.events, suffix: "+", label: "Events" },
        { value: data.clans, suffix: "+", label: "Clans" },
        { value: data.memories, suffix: "+", label: "Memories" },
      ]
    : null;

  return (
    <section ref={ref} className="bg-emerald-600">
      <div className="container grid grid-cols-2 divide-gray-200/10 sm:grid-cols-4 sm:divide-x">
        {stats ? (
          stats.map((s) => <StatItem key={s.label} {...s} start={visible} />)
        ) : (
          <div className="col-span-2 py-8 text-center text-sm text-emerald-100 sm:col-span-4">
            Stats load ho rahi hain...
          </div>
        )}
      </div>
    </section>
  );
}
