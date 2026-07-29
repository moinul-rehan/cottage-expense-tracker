"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** Renders a timestamp in the viewer's own browser timezone. format-date's
 * formatDateTime executes wherever it's called - inside a Server Component
 * that resolves to the server's timezone, not the visitor's - so anything
 * showing a precise time-of-day (not just a calendar date) needs this
 * instead. Deferred to useSyncExternalStore (server snapshot = null) so the
 * server-rendered markup never guesses the visitor's timezone and risks a
 * hydration mismatch - mirrors LocalClock's approach. */
export function LocalDateTime({ iso }: { iso: string }) {
  const getSnapshot = () => {
    const date = new Date(iso);
    const day = date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${day}, ${time}`;
  };

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);

  return <>{snapshot}</>;
}
