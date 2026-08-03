import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUsers } from "./push";

/** `since`: only count notifications from the current active month onward (see getActiveMonthStartedAt) - pass null to count everything. */
export async function getUnreadCount(supabase: SupabaseClient, userId: string, since: string | null) {
  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (since) query = query.gte("created_at", since);
  const { count } = await query;
  return count ?? 0;
}

/** `since`: only return notifications from the current active month onward (see getActiveMonthStartedAt) - pass null to return everything. */
export async function getNotifications(supabase: SupabaseClient, userId: string, since: string | null, limit = 30) {
  let query = supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (since) query = query.gte("created_at", since);
  const { data } = await query;
  return data ?? [];
}

/** Insert a notification for every given user. Call from server actions after the triggering write. */
export async function notifyUsers(
  supabase: SupabaseClient,
  cottageId: string,
  userIds: string[],
  notification: { type: string; title: string; body?: string; link?: string }
) {
  if (userIds.length === 0) return;

  await supabase.from("notifications").insert(
    userIds.map((userId) => ({
      cottage_id: cottageId,
      user_id: userId,
      ...notification,
    }))
  );

  // Push delivery fans out to one third-party HTTPS request per
  // subscription (see push.ts) - potentially slow, and never read back by
  // the caller, so it runs after the response is sent instead of blocking
  // whatever action called notifyUsers.
  after(() => sendPushToUsers(userIds, notification));
}

/**
 * Same as notifyUsers, but for the case where every recipient gets a
 * *different* title/body (e.g. "your meal count was logged: 2 meals" - the
 * count differs per member) - one batched insert instead of one insert per
 * user. Call from server actions after the triggering write.
 */
export async function notifyUsersIndividually(
  supabase: SupabaseClient,
  cottageId: string,
  rows: { userId: string; type: string; title: string; body?: string; link?: string }[]
) {
  if (!rows.length) return;

  await supabase.from("notifications").insert(
    rows.map(({ userId, ...notification }) => ({
      cottage_id: cottageId,
      user_id: userId,
      ...notification,
    }))
  );

  after(() =>
    Promise.all(rows.map(({ userId, ...notification }) => sendPushToUsers([userId], notification)))
  );
}
