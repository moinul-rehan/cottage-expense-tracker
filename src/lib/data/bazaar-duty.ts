import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { todayInDhaka } from "@/lib/dhaka-date";

export type BazaarDuty = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  note: string | null;
};

/** All duties (current or upcoming) per member, for the admin Members page. */
export async function getUpcomingBazaarDuties(supabase: SupabaseClient, cottageId: string) {
  const today = todayInDhaka();
  const { data } = await supabase
    .from("bazaar_duties")
    .select("id, user_id, start_date, end_date, note")
    .eq("cottage_id", cottageId)
    .gte("end_date", today)
    .order("start_date");

  const byUser = new Map<string, BazaarDuty[]>();
  for (const d of data ?? []) {
    const list = byUser.get(d.user_id) ?? [];
    list.push(d);
    byUser.set(d.user_id, list);
  }
  return byUser;
}

/** Flat, sorted list of every upcoming/current duty in the cottage - for the
 * Dashboard's shared roster (every member should see everyone's duty, not
 * just their own). */
export async function getCottageBazaarDuties(
  supabase: SupabaseClient,
  cottageId: string,
  limit = 8
): Promise<BazaarDuty[]> {
  const today = todayInDhaka();
  const { data } = await supabase
    .from("bazaar_duties")
    .select("id, user_id, start_date, end_date, note")
    .eq("cottage_id", cottageId)
    .gte("end_date", today)
    .order("start_date")
    .limit(limit);
  return data ?? [];
}

/** Every duty (past and upcoming) in the cottage, newest-starting first -
 * used to block assigning a range that overlaps someone else's duty. */
export async function getAllBazaarDuties(supabase: SupabaseClient, cottageId: string): Promise<BazaarDuty[]> {
  const { data } = await supabase
    .from("bazaar_duties")
    .select("id, user_id, start_date, end_date, note")
    .eq("cottage_id", cottageId)
    .order("start_date", { ascending: false });
  return data ?? [];
}

/** The current member's own current/next duty, for their Dashboard. */
export async function getMyNextBazaarDuty(supabase: SupabaseClient, userId: string) {
  const today = todayInDhaka();
  const { data } = await supabase
    .from("bazaar_duties")
    .select("id, user_id, start_date, end_date, note")
    .eq("user_id", userId)
    .gte("end_date", today)
    .order("start_date")
    .limit(1)
    .maybeSingle();
  return data as BazaarDuty | null;
}
