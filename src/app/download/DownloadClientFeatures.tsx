"use client";

import { useState } from "react";
import { Download, QrCode, Apple, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="mt-8 flex flex-col items-center gap-6">
      {/* Primary CTA Button & Platform Adaptive Component */}
      {platform === "ios" ? (
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            disabled
            className="h-12 rounded-full px-8 text-base opacity-75"
          >
            <Apple className="size-5 mr-2" />
            iOS version coming soon
          </Button>
          <span className="text-xs text-muted-foreground">
            iPhone and iPad native versions are currently in development.
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            nativeButton={false}
            render={<a href="/download/latest" download />}
            className="h-12 rounded-full px-8 text-base gap-2 shadow-md shadow-primary/20"
          >
            <Download className="size-5" />
            Download for Android
            <ArrowRight className="size-4" />
          </Button>

          {/* Metadata Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              Version: <span className="text-primary font-bold">v{activeRelease?.version}</span>
            </span>
            <span>•</span>
            <span>Size: {activeRelease?.sizeMb}</span>
            <span>•</span>
            <span>Released: {activeRelease?.releaseDate}</span>
            <span>•</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary uppercase text-[10px]">
              {activeRelease?.channel}
            </span>
          </div>
        </div>
      )}

      {/* Desktop QR Code Scanner Widget */}
      {platform === "desktop" && (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <QrCode className="size-4 text-primary" />
            <span>Scan to Download Directly on Mobile Phone</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-white p-2.5 shadow-xs">
            <img
              src={qrCodeDataUrl}
              alt="Scan QR Code to Download APK"
              className="size-36 rounded-md object-contain"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Open camera app on your Android phone to scan
          </p>
        </div>
      )}
    </div>
  );
}
