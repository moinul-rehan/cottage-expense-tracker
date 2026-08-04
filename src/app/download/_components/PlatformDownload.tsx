"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "desktop";
}

export function PlatformDownload({ hasRelease }: { hasRelease: boolean }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    if (platform !== "desktop" || !hasRelease || !canvasRef.current) return;
    const url = `${window.location.origin}/download`;
    import("qrcode")
      .then((QRCode) => QRCode.toCanvas(canvasRef.current!, url, { width: 160, margin: 1 }))
      .catch(() => {});
  }, [platform, hasRelease]);

  if (platform === null) {
    // Avoid a mismatch flash - render nothing meaningful until we know the platform.
    return <div className="h-12" />;
  }

  if (!hasRelease) {
    return (
      <p className="rounded-full bg-muted px-5 py-3 text-sm font-medium text-muted-foreground">
        Coming soon - no release has been published yet.
      </p>
    );
  }

  if (platform === "ios") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button size="lg" disabled className="opacity-60">
          <Smartphone className="mr-1" /> iOS version coming soon.
        </Button>
        <p className="text-sm text-muted-foreground">
          Cottage for iPhone isn&apos;t available yet - check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <a href="/download/latest">
        <Button size="lg">
          <Download className="mr-1" /> Download for Android
        </Button>
      </a>
      {platform === "desktop" && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-sm text-muted-foreground">Scan with your Android phone to download</p>
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-foreground/10">
            <canvas ref={canvasRef} />
          </div>
        </div>
      )}
    </div>
  );
}
