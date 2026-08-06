import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthlyDues } from "./finance";
import { getMealTotals } from "./meal";
import { todayInDhaka } from "@/lib/dhaka-date";

export { formatMonthKey } from "@/lib/format-month";

/** The cottage's single authoritative "current month" - drives Dashboard/Meal/Utilities. */
export async function getActiveMonthKey(supabase: SupabaseClient, cottageId: string) {
  const { data } = await supabase
    .from("cottages")
    .select("active_month_key")
    .eq("id", cottageId)
    .single();
  return (data?.active_month_key as string | undefined) ?? todayInDhaka().slice(0, 7);
}

/** Today's date if it falls within `monthKey`, otherwise the 1st of that month - a sane default for date pickers when the active month isn't the real calendar month. */
export function defaultDateForMonth(monthKey: string): string {
  const today = todayInDhaka();
  return today.slice(0, 7) === monthKey ? today : `${monthKey}-01`;
}

/** When the cottage's current active month began - the `closed_at` of the most recently closed prior month, or null if no month has ever been closed yet. Used to scope things like notifications to "since the current month started". */
export async function getActiveMonthStartedAt(supabase: SupabaseClient, cottageId: string): Promise<string | null> {
  const { data } = await supabase
    .from("month_closures")
    .select("closed_at")
    .eq("cottage_id", cottageId)
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.closed_at ?? null;
}

export function nextMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type MonthSummary = {
  monthKey: string;
  closedAt: string | null;
  totalUtilityDue: number;
  totalBazaar: number;
  totalMeals: number;
  mealRate: number;
};

async function getMonthSummary(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
): Promise<Omit<MonthSummary, "monthKey" | "closedAt">> {
  const [dues, mealTotals] = await Promise.all([
    getMonthlyDues(supabase, cottageId, monthKey),
    getMealTotals(supabase, monthKey),
  ]);

  const totalUtilityDue = Array.from(dues.values()).reduce((sum, d) => sum + d.due, 0);

  return {
    totalUtilityDue,
    totalBazaar: mealTotals.totalBazaar,
    totalMeals: mealTotals.totalMeals,
    mealRate: mealTotals.mealRate,
  };
}

export async function getActiveMonthSummary(
  supabase: SupabaseClient,
  cottageId: string,
  monthKey: string
): Promise<MonthSummary> {
  const summary = await getMonthSummary(supabase, cottageId, monthKey);
  return { monthKey, closedAt: null, ...summary };
}

/** Locked (history) months for a cottage, newest first, each with a quick summary.
 *
 * Fetches every table once across ALL history months (not once per month -
 * a cottage with a year of history previously cost 6 round trips per month,
 * ~73 total; this costs 6 flat) and sums in memory per month_key. */
export async function getMonthHistory(supabase: SupabaseClient, cottageId: string): Promise<MonthSummary[]> {
  const { data: closures } = await supabase
    .from("month_closures")
    .select("month_key, closed_at")
    .eq("cottage_id", cottageId)
    .order("month_key", { ascending: false });

  const rows = closures ?? [];
  if (!rows.length) return [];

  const monthKeys = rows.map((r) => r.month_key);

  const [adjustments, deposits, carryIns, bazaar, meals] = await Promise.all([
    supabase.from("utility_adjustments").select("amount, month_key").eq("cottage_id", cottageId).in("month_key", monthKeys),
    supabase
      .from("utility_deposits")
      .select("amount, month_key")
      .eq("cottage_id", cottageId)
      .eq("source_type", "member")
      .in("month_key", monthKeys),
    supabase.from("utility_carry_ins").select("amount, month_key").eq("cottage_id", cottageId).in("month_key", monthKeys),
    supabase.from("bazaar_entries").select("amount, month_key").eq("cottage_id", cottageId).in("month_key", monthKeys),
    supabase.from("daily_meals").select("count, month_key").eq("cottage_id", cottageId).in("month_key", monthKeys),
  ]);

  function sumByMonth(data: { amount?: number; count?: number; month_key: string }[] | null, field: "amount" | "count") {
    const byMonth = new Map<string, number>();
    for (const row of data ?? []) {
      byMonth.set(row.month_key, (byMonth.get(row.month_key) ?? 0) + Number(row[field] ?? 0));
    }
    return byMonth;
  }

  const adjByMonth = sumByMonth(adjustments.data, "amount");
  const depByMonth = sumByMonth(deposits.data, "amount");
  const carryByMonth = sumByMonth(carryIns.data, "amount");
  const bazaarByMonth = sumByMonth(bazaar.data, "amount");
  const mealsByMonth = sumByMonth(meals.data, "count");

  return rows.map((row) => {
    const totalUtilityDue =
      (adjByMonth.get(row.month_key) ?? 0) + (carryByMonth.get(row.month_key) ?? 0) - (depByMonth.get(row.month_key) ?? 0);
    const totalBazaar = bazaarByMonth.get(row.month_key) ?? 0;
    const totalMeals = mealsByMonth.get(row.month_key) ?? 0;
    const mealRate = totalMeals > 0 ? totalBazaar / totalMeals : 0;

    return { monthKey: row.month_key, closedAt: row.closed_at, totalUtilityDue, totalBazaar, totalMeals, mealRate };
  });
}
