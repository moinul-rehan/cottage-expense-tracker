/**
 * "Today" (YYYY-MM-DD) in Asia/Dhaka, not the server's/browser's own
 * timezone. `new Date().toISOString().slice(0, 10)` (still scattered
 * across a few call sites) is UTC, which for Bangladesh (UTC+6) shows
 * yesterday's date for the first ~6 hours of each Dhaka calendar day -
 * same bug class already fixed once for month rollover, see
 * supabase/migrations/0041_fix_active_month_timezone.sql. Safe to call from
 * both Server and Client Components (no `server-only`).
 */
export function todayInDhaka(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
}
