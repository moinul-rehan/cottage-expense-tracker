import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { GoBackButton } from "@/components/GoBackButton";

function LostCottageIllustration() {
  return (
    <svg viewBox="0 0 320 240" className="h-auto w-72 sm:w-80" role="img" aria-labelledby="lost-illustration-title">
      <title id="lost-illustration-title">A cottage with a signpost pointing every direction but the right one</title>

      <ellipse cx="160" cy="214" rx="120" ry="14" fill="currentColor" className="text-muted-foreground/10" />

      {/* signpost */}
      <rect x="247" y="120" width="6" height="90" rx="3" fill="currentColor" className="text-muted-foreground/40" />
      <g className="text-muted-foreground/30" fill="currentColor">
        <rect x="215" y="128" width="60" height="16" rx="3" transform="rotate(-8 245 136)" />
        <rect x="215" y="150" width="46" height="16" rx="3" transform="rotate(6 238 158)" />
      </g>

      {/* cottage */}
      <rect x="55" y="120" width="120" height="80" rx="6" fill="#63B64E" fillOpacity="0.15" />
      <path d="M48 128 L115 84 L182 128 Z" fill="#63B64E" />
      <rect x="95" y="150" width="30" height="50" rx="3" fill="#63B64E" fillOpacity="0.35" />
      <rect x="140" y="140" width="24" height="24" rx="3" fill="#FA9033" fillOpacity="0.5" />
      <rect x="70" y="140" width="24" height="24" rx="3" fill="#FA9033" fillOpacity="0.5" />

      {/* dotted wandering path */}
      <path
        d="M20 205 C 60 190, 70 170, 40 150 S 10 110, 55 100"
        stroke="currentColor"
        className="text-muted-foreground/30"
        strokeWidth="3"
        strokeDasharray="2 8"
        strokeLinecap="round"
        fill="none"
      />

      {/* confused wanderer */}
      <g transform="translate(18 158)">
        <circle cx="10" cy="6" r="7" fill="#DE7356" />
        <path d="M0 34 Q10 14 20 34" stroke="#DE7356" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M-2 20 L4 30 M22 20 L16 30" stroke="#DE7356" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* question mark bubble */}
      <g transform="translate(24 118)">
        <circle r="14" fill="white" stroke="#FF4F4F" strokeWidth="2" />
        <text x="0" y="6" textAnchor="middle" fontSize="16" fontWeight="700" fill="#FF4F4F">
          ?
        </text>
      </g>
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
        <Logo size={26} />
        Cottage
      </div>

      <LostCottageIllustration />

      <div className="flex max-w-sm flex-col items-center gap-2">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">404</p>
        <h1 className="text-xl font-semibold text-foreground">This page wandered off</h1>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, moved, or the link is broken. Let&apos;s get you back
          somewhere useful.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <GoBackButton />
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          <Home className="size-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
