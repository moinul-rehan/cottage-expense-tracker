"use server";

import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUsers } from "@/lib/data/notifications";

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
  const cottageId = String(formData.get("cottage_id") ?? "").trim();
  const memberId = String(formData.get("member_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();

  if (!title) return { error: "Title is required." };
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
        type: "platform_announcement",
        title,
        body: body || undefined,
        link: link || undefined,
      })
    )
  );

  return { success: `Sent to ${recipients.length} member${recipients.length === 1 ? "" : "s"}.` };
}
