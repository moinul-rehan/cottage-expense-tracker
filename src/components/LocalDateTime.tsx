"use client";

/** Renders a timestamp in the viewer's own browser timezone. format-date's
 * formatDateTime executes wherever it's called - inside a Server Component
 * that resolves to the server's timezone, not the visitor's - so anything
 * showing a precise time-of-day (not just a calendar date) needs this
 * instead. */
export function LocalDateTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <>
      {day}, {time}
    </>
  );
}
