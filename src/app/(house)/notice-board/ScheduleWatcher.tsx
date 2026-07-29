"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Renders nothing - schedules a single refresh for the next moment a
 * notice's status should flip (scheduled → published, published →
 * expired), so the board and dashboard update live instead of only on
 * the next manual reload. Re-arms itself after every refresh because the
 * parent recomputes `wakeAt` from fresh data on each render. */
export function ScheduleWatcher({ wakeAt }: { wakeAt: string[] }) {
  const router = useRouter();

  useEffect(() => {
    if (!wakeAt.length) return;
    const now = Date.now();
    const msUntilNext = Math.min(
      ...wakeAt.map((t) => new Date(t).getTime() - now).filter((ms) => ms > 0)
    );
    if (!Number.isFinite(msUntilNext)) return;

    // setTimeout overflows past ~24.8 days; cap the wait so a far-future
    // schedule just re-checks periodically instead of firing immediately.
    const MAX_WAIT_MS = 30 * 60 * 1000;
    // Small buffer so the refreshed query's `now` is unambiguously past the target instant.
    const timer = setTimeout(() => router.refresh(), Math.min(msUntilNext, MAX_WAIT_MS) + 500);
    return () => clearTimeout(timer);
  }, [wakeAt, router]);

  return null;
}
