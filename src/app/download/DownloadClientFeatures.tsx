"use client";

import { useState } from "react";
import { Download, QrCode, Apple } from "lucide-react";
import type { ActiveRelease } from "./page";

function detectPlatform(): "android" | "ios" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const userAgent = navigator.userAgent || navigator.vendor || "";
  if (/android/i.test(userAgent)) {
    return "android";
  }
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "ios";
  }
  return "desktop";
}

export function DownloadClientFeatures({ activeRelease }: { activeRelease: ActiveRelease }) {
  const [platform] = useState<"android" | "ios" | "desktop">(() => detectPlatform());
  const [downloadUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/download/latest`;
    }
    return "/download/latest";
  });

  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    downloadUrl
  )}&color=DE7356&bgcolor=FFFFFF`;

  return (
    <div className="mt-8 flex flex-col items-center">
      {/* Primary CTA Button & Platform Adaptive Component */}
      {platform === "ios" ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            disabled
            className="flex items-center gap-3 rounded-2xl bg-white/10 px-8 py-4 text-base font-semibold text-white/50 cursor-not-allowed border border-white/10 opacity-75"
          >
            <Apple className="size-6" />
            iOS version coming soon
          </button>
          <span className="text-xs text-white/40">
            iPhone and iPad native versions are currently in development.
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <a
            href="/download/latest"
            className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-95"
          >
            <Download className="size-6 transition-transform group-hover:-translate-y-0.5" />
            <span>Download for Android</span>
          </a>

          {/* Metadata Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1 font-semibold text-white">
              Version: <span className="text-primary font-bold">v{activeRelease?.version}</span>
            </span>
            <span>•</span>
            <span>Size: {activeRelease?.sizeMb}</span>
            <span>•</span>
            <span>Released: {activeRelease?.releaseDate}</span>
            <span>•</span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-400 uppercase text-[10px]">
              {activeRelease?.channel}
            </span>
          </div>
        </div>
      )}

      {/* Desktop QR Code Scanner Widget */}
      {platform === "desktop" && (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <QrCode className="size-4 text-primary" />
            <span>Scan to Download Directly on Mobile Phone</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white p-2.5 shadow-lg">
            <img
              src={qrCodeDataUrl}
              alt="Scan QR Code to Download APK"
              className="size-36 rounded-md object-contain"
            />
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            Open camera app on your Android phone to scan
          </p>
        </div>
      )}
    </div>
  );
}
