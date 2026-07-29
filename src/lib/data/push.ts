import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails("mailto:admin@cottagee.me", vapidPublicKey, vapidPrivateKey);
}

/**
 * Best-effort device push, sent alongside every in-app notification. Never
 * throws -- a dead subscription or missing VAPID config must not break
 * whatever action triggered the notification.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body?: string; link?: string }
) {
  if (!userIds.length || !vapidPublicKey || !vapidPrivateKey) return;

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subs?.length) return;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
