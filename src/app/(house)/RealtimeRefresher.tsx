"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Every table with data that can change from another member's action and
// should be reflected on this page without a manual reload.
const COTTAGE_TABLES = [
  "daily_meals",
  "bazaar_entries",
  "meal_deposits",
  "expenses",
  "utility_adjustments",
  "utility_deposits",
  "cottage_balance_transactions",
  "notices",
] as const;

/** Mounted once in the (house) layout — keeps every page live. Subscribes to
 * Postgres changes for this cottage (any member's meal/expense/deposit/
 * notice edits) and this user's own notifications, then calls
 * router.refresh() so Server Components re-fetch with the new data. Changes
 * are debounced since several inserts often land within the same
 * server-action call (e.g. a custom-split utility adjustment writes one row
 * per member) — no need to refresh once per row. */
export function RealtimeRefresher({ cottageId, userId }: { cottageId: string; userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleRefresh() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    }

    let channel = supabase.channel(`cottage-${cottageId}`);
    for (const table of COTTAGE_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `cottage_id=eq.${cottageId}` },
        scheduleRefresh
      );
    }
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      scheduleRefresh
    );
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [cottageId, userId, router]);

  return null;
}
