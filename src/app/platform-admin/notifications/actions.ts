"use server";

import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUsers } from "@/lib/data/notifications";
import { PLATFORM_NOTIFICATION_TYPE_PREFIX, isValidPlatformCategory } from "./categories";

export type SendNotificationState = { error?: string; success?: string } | undefined;

/**
 * Broadcasts a push + in-app notification from the platform admin to either
 * a single member, every member of one Cottage, or every member across every
 * Cottage. The `notifications` table requires a `cottage_id` per row, so
 * targets are grouped by cottage and sent one notifyUsers() call per group.
 */
export async function sendPlatformNotification(
  _prevState: SendNotificationState,
  formData: FormData
): Promise<SendNotificationState> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const target = String(formData.get("target") ?? "");
  const category = String(formData.get("category") ?? "");
  const cottageId = String(formData.get("cottage_id") ?? "").trim();
  const memberId = String(formData.get("member_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const linkInput = String(formData.get("link") ?? "").trim();
  // A bare "/path" is an in-app route; anything else is a custom URL (e.g. a
  // Facebook group invite) that should redirect straight there, not get
  // resolved against this site's own origin -- so if it's missing a scheme,
  // add one rather than let the browser treat it as a relative path.
  const link = linkInput && !linkInput.startsWith("/") && !/^https?:\/\//i.test(linkInput)
    ? `https://${linkInput}`
    : linkInput;

  if (!title) return { error: "Title is required." };
  if (!isValidPlatformCategory(category)) return { error: "Choose a category." };
  if (target === "cottage" && !cottageId) return { error: "Choose a Cottage." };
  if (target === "member" && !memberId) return { error: "Choose a member." };

  let recipients: { id: string; cottage_id: string }[] = [];

  if (target === "member") {
    const { data } = await admin.from("profiles").select("id, cottage_id").eq("id", memberId).maybeSingle();
    if (!data) return { error: "That member no longer exists." };
    recipients = [data];
  } else if (target === "cottage") {
    const { data } = await admin.from("profiles").select("id, cottage_id").eq("cottage_id", cottageId).eq("is_active", true);
    recipients = data ?? [];
  } else if (target === "everyone") {
    const { data } = await admin.from("profiles").select("id, cottage_id").eq("is_active", true);
    recipients = data ?? [];
  } else {
    return { error: "Choose who to notify." };
  }

  if (!recipients.length) return { error: "No members match that target." };

  const byCottage = new Map<string, string[]>();
  for (const r of recipients) {
    const list = byCottage.get(r.cottage_id) ?? [];
    list.push(r.id);
    byCottage.set(r.cottage_id, list);
  }

  await Promise.all(
    Array.from(byCottage.entries()).map(([cid, userIds]) =>
      notifyUsers(admin, cid, userIds, {
        type: `${PLATFORM_NOTIFICATION_TYPE_PREFIX}${category}`,
        title,
        body: body || undefined,
        link: link || undefined,
      })
    )
  );

  return { success: `Sent to ${recipients.length} member${recipients.length === 1 ? "" : "s"}.` };
}
