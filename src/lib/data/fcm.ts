import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Native push to the Flutter Android app's system notification tray, via
 * Firebase Cloud Messaging - separate from sendPushToUsers in push.ts
 * (browser Web Push/VAPID, unusable by a native app). Targets device tokens
 * in `fcm_tokens` (see supabase/migrations/0047_fcm_tokens.sql), written by
 * the Flutter app's PushNotificationService.registerToken().
 *
 * FIREBASE_SERVICE_ACCOUNT must be the full JSON contents of a Firebase
 * service account key (Firebase Console > Project Settings > Service
 * Accounts > Generate new private key), stored as a single-line env var.
 * Never throws when unconfigured or on send failure - a missing key or a
 * dead token must not break whatever action triggered the notification.
 */
function getFirebaseAdminApp(): App | null {
  const existing = getApps()[0];
  if (existing) return existing;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    const serviceAccount = JSON.parse(raw);
    return initializeApp({ credential: cert(serviceAccount) });
  } catch (error) {
    console.error("[fcm] invalid FIREBASE_SERVICE_ACCOUNT", (error as Error).message);
    return null;
  }
}

export async function sendFcmToUsers(
  userIds: string[],
  payload: { title: string; body?: string; link?: string }
) {
  if (!userIds.length) return;

  const app = getFirebaseAdminApp();
  if (!app) {
    console.error("[fcm] FIREBASE_SERVICE_ACCOUNT missing at runtime, skipping send");
    return;
  }

  const admin = createAdminClient();
  const { data: tokens, error } = await admin.from("fcm_tokens").select("id, token").in("user_id", userIds);

  if (error) {
    console.error("[fcm] token lookup failed", error.message);
    return;
  }
  if (!tokens?.length) return;

  const messaging = getMessaging(app);
  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title: payload.title, body: payload.body },
    data: payload.link ? { link: payload.link } : undefined,
    android: { priority: "high" },
  });

  // Prune tokens FCM reports as no-longer-registered (uninstalled app,
  // reinstalled with a new token, etc) so future sends don't keep retrying
  // them.
  const deadTokenIds = response.responses
    .map((r, i) => (!r.success && isUnregisteredError(r.error?.code) ? tokens[i].id : null))
    .filter((id): id is string => id !== null);

  if (deadTokenIds.length) {
    await admin.from("fcm_tokens").delete().in("id", deadTokenIds);
  }
}

function isUnregisteredError(code?: string) {
  return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
}
