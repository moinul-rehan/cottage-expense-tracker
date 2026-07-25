"use client";

import { useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

/** Packs time+date into one primitive so useSyncExternalStore can compare
 * snapshots by value (objects would be a new reference every tick). */
function getSnapshot() {
  const now = new Date();
  const time = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const day = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return `${time}|${day}`;
}

function getServerSnapshot(): string | null {
  return null;
}

/** Placed beside the theme toggle — the member's own device clock, purely
 * informational (no timezone math, no server round-trip). Renders nothing
 * until mounted so the server-rendered markup never has to guess the
 * visitor's local time and risk a hydration mismatch. */
export function LocalClock() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!snapshot) {
    return <span className="hidden h-[42px] w-[104px] shrink-0 rounded-2xl border border-transparent sm:block" aria-hidden />;
  }

  const [time, day] = snapshot.split("|");

  return (
    <div className="hidden shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-card px-3.5 py-1.5 sm:flex">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground tabular-nums">
        <Clock className="size-4 text-muted-foreground" />
        {time}
      </span>
      <span className="text-[11px] text-muted-foreground">{day}</span>
    </div>
  );
}
