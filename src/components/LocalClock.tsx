"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatNow() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    day: now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
  };
}

/** Placed beside the theme toggle — the member's own device clock, purely
 * informational (no timezone math, no server round-trip). Renders nothing
 * until mounted so the server-rendered markup never has to guess the
 * visitor's local time and risk a hydration mismatch. */
export function LocalClock() {
  const [now, setNow] = useState<{ time: string; day: string } | null>(null);

  useEffect(() => {
    setNow(formatNow());
    const id = setInterval(() => setNow(formatNow()), 15_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <span className="hidden h-[42px] w-[92px] shrink-0 rounded-full border border-transparent sm:block" aria-hidden />;

  return (
    <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 sm:flex" title={now.day}>
      <Clock className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground tabular-nums">{now.time}</span>
    </div>
  );
}
