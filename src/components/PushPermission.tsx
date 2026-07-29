"use client";

import { useEffect, useState } from "react";
import { BellOff, Bell, X } from "lucide-react";
import { saveSubscription } from "@/app/(house)/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function subscribe() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await saveSubscription(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
}

/** Requests device-notification permission on every mount (i.e. every
 * authenticated page load) as long as the member hasn't decided yet --
 * browsers won't let a site re-prompt once "Block" is tapped, so once
 * denied this falls back to a dismissible hint instead of nagging. */
export function PushPermission() {
  const [status, setStatus] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isSupported()) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;

    async function run() {
      if (Notification.permission === "granted") {
        setStatus("granted");
        subscribe().catch((err) => console.error("[push] subscribe failed", err));
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      // "default" -- undecided. Auto-prompt; on iOS Safari this can silently
      // no-op without a real user gesture, hence the fallback button below.
      try {
        const result = await Notification.requestPermission();
        if (cancelled) return;
        setStatus(result);
        if (result === "granted") await subscribe();
      } catch {
        if (!cancelled) setStatus("default");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnableClick() {
    const result = await Notification.requestPermission();
    setStatus(result);
    if (result === "granted") await subscribe().catch((err) => console.error("[push] subscribe failed", err));
  }

  if (dismissed || status === "granted" || status === "unsupported") return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-[55] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-card p-3 text-sm shadow-lg ring-1 ring-foreground/10 md:bottom-4">
      {status === "denied" ? (
        <BellOff className="size-5 shrink-0 text-muted-foreground" />
      ) : (
        <Bell className="size-5 shrink-0 text-primary" />
      )}
      <div className="min-w-0 flex-1">
        {status === "denied" ? (
          <p className="text-foreground">
            Notifications are blocked. Enable them in your browser&apos;s site settings to get alerts when the
            app is closed.
          </p>
        ) : (
          <>
            <p className="text-foreground">Turn on notifications to get alerts even when the app is closed.</p>
            <button
              type="button"
              onClick={handleEnableClick}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              <Bell className="size-3.5" />
              Enable notifications
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
