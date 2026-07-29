import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NoticePriority, NoticeType, NoticeVisibility, PinDuration } from "@/lib/notice-types";

export type NoticeRow = {
  id: string;
  title: string;
  description: string;
  type: NoticeType;
  priority: NoticePriority;
  visibility: NoticeVisibility;
  target_member_ids: string[];
  is_pinned: boolean;
  pin_duration: PinDuration;
  pin_until_date: string | null;
  is_anonymous: boolean;
  publish_at: string;
  expires_at: string;
  archived_at: string | null;
  due_amount: number | null;
  due_date: string | null;
  meal_lunch: string | null;
  meal_dinner: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const NOTICE_COLUMNS =
  "id, title, description, type, priority, visibility, target_member_ids, is_pinned, pin_duration, pin_until_date, is_anonymous, publish_at, expires_at, archived_at, due_amount, due_date, meal_lunch, meal_dinner, created_by, created_at, updated_at";

/** Every notice this caller is allowed to see in their cottage (RLS already
 * scopes by visibility) - callers filter by status/pin themselves so one
 * query can serve the Feed, Scheduled and History views. */
export async function getNotices(supabase: SupabaseClient, cottageId: string): Promise<NoticeRow[]> {
  const { data } = await supabase
    .from("notices")
    .select(NOTICE_COLUMNS)
    .eq("cottage_id", cottageId)
    .order("created_at", { ascending: false });
  return (data ?? []) as NoticeRow[];
}
