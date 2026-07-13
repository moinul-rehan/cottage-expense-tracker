"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Logo } from "@/components/logo";

const DISMISS_KEY = "cottage-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isCooldownActive() {
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

// Client-only detection (window isn't available during SSR) — state starts
// false to match the server-rendered output, then flips after mount. This
// is the standard SSR-safe pattern for values that can only be known in
// the browser; the setState-in-effect lint rule doesn't apply cleanly here.
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || isCooldownActive()) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    if (iOS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe client-only detection, see comment above
      setIsIOS(true);
      setVisible(true);
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    function handleInstalled() {
      setVisible(false);
    }
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-md items-start gap-3 rounded-2xl bg-card p-4 text-sm shadow-lg ring-1 ring-foreground/10">
        <Logo size={40} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-semibold text-foreground">Install Cottage</p>
          {isIOS ? (
            <p className="text-muted-foreground">
              Tap <Share className="mx-0.5 inline size-3.5 align-text-bottom" /> Share, then{" "}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <SquarePlus className="size-3.5" /> Add to Home Screen
              </span>
              .
            </p>
          ) : (
            <p className="text-muted-foreground">
              Add it to your home screen for quick, full-screen access — no browser tabs.
            </p>
          )}
          {!isIOS && (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
            >
              <Download className="size-4" />
              Install app
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
