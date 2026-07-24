"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import {
  NOTICE_TYPE_META,
  canCreateNoticeType,
  canManageNotice,
  type NoticePriority,
  type NoticeType,
  type NoticeVisibility,
  type PinDuration,
} from "@/lib/notice-types";

export type CreateNoticeState = { error?: string } | undefined;

const NOTICE_TYPES = Object.keys(NOTICE_TYPE_META) as NoticeType[];
const PRIORITIES: NoticePriority[] = ["critical", "high", "normal", "low"];
const VISIBILITIES: NoticeVisibility[] = ["everyone", "specific", "selected", "admins"];
const PIN_DURATIONS: PinDuration[] = ["none", "until_manual", "1d", "3d", "until_date", "until_expires"];

function combineDateTime(date: string, time: string, fallback: Date) {
  if (!date) return fallback;
  const [h = "0", m = "0"] = (time || "00:00").split(":");
  const d = new Date(date + "T00:00:00");
  d.setHours(Number(h), Number(m), 0, 0);
  return d;
}

export async function createNotice(_prevState: CreateNoticeState, formData: FormData): Promise<CreateNoticeState> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "") as NoticeType;
  const priority = String(formData.get("priority") ?? "normal") as NoticePriority;
  const visibility = String(formData.get("visibility") ?? "") as NoticeVisibility;
  const targetMemberIds = formData.getAll("target_member_ids").map(String).filter(Boolean);
  const isPinned = formData.get("is_pinned") === "on";
  const pinDuration = (isPinned ? String(formData.get("pin_duration") ?? "until_manual") : "none") as PinDuration;
  const pinUntilDate = String(formData.get("pin_until_date") ?? "") || null;
  const isAnonymous = formData.get("is_anonymous") === "on";
  const publishDate = String(formData.get("publish_date") ?? "");
  const publishTime = String(formData.get("publish_time") ?? "");
  const expireDate = String(formData.get("expire_date") ?? "");
  const expireTime = String(formData.get("expire_time") ?? "");
  const dueAmount = formData.get("due_amount") ? Number(formData.get("due_amount")) : null;
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const mealLunch = String(formData.get("meal_lunch") ?? "").trim() || null;
  const mealDinner = String(formData.get("meal_dinner") ?? "").trim() || null;

  if (!title) return { error: "Give the notice a title." };
  if (!NOTICE_TYPES.includes(type)) return { error: "Pick a valid notice type." };
  if (!PRIORITIES.includes(priority)) return { error: "Pick a valid priority." };
  if (!VISIBILITIES.includes(visibility)) return { error: "Choose who this notice is visible to." };
  if (!PIN_DURATIONS.includes(pinDuration)) return { error: "Pick a valid pin duration." };
  if (isAnonymous && profile.role !== "super_admin") return { error: "Only the super admin can post anonymously." };

  if (!canCreateNoticeType(profile, type)) {
    return { error: "You don't have permission to create this notice type." };
  }
  if (!NOTICE_TYPE_META[type].visibilities.includes(visibility)) {
    return { error: `${NOTICE_TYPE_META[type].label} can't be sent to "${visibility}".` };
  }
  if ((visibility === "specific" || visibility === "selected") && targetMemberIds.length === 0) {
    return { error: "Pick at least one member." };
  }
  if (pinDuration === "until_date" && !pinUntilDate) {
    return { error: "Pick the date to pin until." };
  }

  const now = new Date();
  const publishAt = combineDateTime(publishDate, publishTime, now);
  const expiresAt = combineDateTime(expireDate, expireTime, new Date(publishAt.getTime() + 7 * 24 * 3600 * 1000));
  if (expiresAt <= publishAt) return { error: "Expiration must be after the publish time." };

  if (targetMemberIds.length) {
    const { data: validMembers } = await supabase
      .from("profiles")
      .select("id")
      .eq("cottage_id", profile.cottage_id)
      .in("id", targetMemberIds);
    const validIds = new Set((validMembers ?? []).map((m) => m.id));
    if (targetMemberIds.some((id) => !validIds.has(id))) return { error: "One of the selected members is invalid." };
  }

  const { data: inserted, error } = await supabase
    .from("notices")
    .insert({
      cottage_id: profile.cottage_id,
      title,
      description,
      type,
      priority,
      visibility,
      target_member_ids: targetMemberIds,
      is_pinned: isPinned,
      pin_duration: pinDuration,
      pin_until_date: pinDuration === "until_date" ? pinUntilDate : null,
      is_anonymous: isAnonymous,
      publish_at: publishAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      due_amount: type === "utility" ? dueAmount : null,
      due_date: type === "utility" ? dueDate : null,
      meal_lunch: type === "meal" ? mealLunch : null,
      meal_dinner: type === "meal" ? mealDinner : null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: `Could not save the notice: ${error?.message ?? "unknown error"}` };

  if (publishAt <= now && targetMemberIds.length) {
    await notifyUsers(
      supabase,
      profile.cottage_id,
      targetMemberIds.filter((id) => id !== profile.id),
      {
        type: "notice_posted",
        title: `${NOTICE_TYPE_META[type].label}: ${title}`,
        body: description.slice(0, 140),
        link: "/notice-board",
      }
    );
  }

  revalidatePath("/notice-board");
  revalidatePath("/dashboard");
  return undefined;
}

export async function setNoticePinned(id: string, isPinned: boolean) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: notice } = await supabase.from("notices").select("created_by, expires_at").eq("id", id).single();
  if (!notice || !canManageNotice(profile, notice)) return;

  await supabase
    .from("notices")
    .update({
      is_pinned: isPinned,
      pin_duration: isPinned ? "until_manual" : "none",
      pin_until_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/notice-board");
  revalidatePath("/dashboard");
}

export async function archiveNotice(id: string) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: notice } = await supabase.from("notices").select("created_by").eq("id", id).single();
  if (!notice || !canManageNotice(profile, notice)) return;

  await supabase.from("notices").update({ archived_at: new Date().toISOString() }).eq("id", id);

  revalidatePath("/notice-board");
  revalidatePath("/dashboard");
}
