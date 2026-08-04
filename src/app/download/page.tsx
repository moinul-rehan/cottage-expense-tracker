import Link from "next/link";
import {
  UtensilsCrossed,
  ShoppingBasket,
  Receipt,
  Users,
  Calculator,
  Bell,
  RefreshCw,
  WifiOff,
  ShieldCheck,
  Download as DownloadIcon,
  FolderOpen,
  ShieldAlert,
  PackageCheck,
  LogIn,
  Smartphone,
  MemoryStick,
  Wifi,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLatestPublishedRelease, formatFileSize } from "@/lib/data/releases";
import { formatDate } from "@/lib/format-date";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformDownload } from "./_components/PlatformDownload";
import { FaqAccordion } from "./_components/FaqAccordion";

export const metadata = {
  title: "Download Cottage",
  description: "Download the Cottage Android app to manage your cottage from anywhere.",
};

const FEATURES = [
  { icon: UtensilsCrossed, title: "Meal Tracking", description: "Log daily meals and keep everyone's count in sync." },
  { icon: ShoppingBasket, title: "Bazaar Management", description: "Assign duty, track spending, and split the shopping." },
  { icon: Receipt, title: "Utility Management", description: "Split gas, electricity, and other bills fairly each month." },
  { icon: Users, title: "Member Management", description: "Invite roommates and manage roles from one place." },
  { icon: Calculator, title: "Smart Due Calculation", description: "Automatic, always-up-to-date balance calculations." },
  { icon: Bell, title: "Notifications", description: "Stay informed the moment something needs your attention." },
  { icon: RefreshCw, title: "Real-time Updates", description: "Changes from roommates show up instantly, no refresh needed." },
  { icon: WifiOff, title: "Offline-friendly Experience", description: "Keep using the app even with a spotty connection." },
];

const STEPS = [
  { icon: DownloadIcon, title: "Download APK", description: "Tap the download button above." },
  { icon: FolderOpen, title: "Open downloaded file", description: "Find cottage.apk in your downloads and open it." },
  { icon: ShieldAlert, title: 'Allow "Install Unknown Apps"', description: "Approve the permission when your phone asks." },
  { icon: PackageCheck, title: "Install Cottage", description: "Confirm the install and wait for it to finish." },
  { icon: LogIn, title: "Login and start using the application", description: "Sign in with your Cottage account and you're set." },
];

const REQUIREMENTS = [
  { icon: Smartphone, label: "Android 9+" },
  { icon: MemoryStick, label: "Minimum 3GB RAM" },
  { icon: Wifi, label: "Internet Connection Required" },
  { icon: Sparkles, label: "Latest Version Recommended" },
];

export default async function DownloadPage() {
  const supabase = await createClient();
  const release = await getLatestPublishedRelease(supabase, "android");

  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      {/* Hero */}
      <header className="flex flex-col items-center gap-6 px-6 pt-16 pb-14 text-center">
        <Logo size={56} />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Download Cottage</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Manage your cottage from anywhere. Track meals, utilities, balances, and notifications in one place.
          </p>
        </div>

        <PlatformDownload hasRelease={!!release} />

        {release && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 pt-2 text-xs text-muted-foreground">
            <span>
              Version <span className="font-medium text-foreground">{release.version}</span>
            </span>
            <span>
              Size <span className="font-medium text-foreground">{formatFileSize(release.file_size)}</span>
            </span>
            <span>
              Released <span className="font-medium text-foreground">{formatDate(release.created_at)}</span>
            </span>
            <span className="capitalize">
              Channel <span className="font-medium text-foreground">{release.channel}</span>
            </span>
          </div>
        )}
      </header>

      {/* Features */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <h2 className="text-center text-xl font-semibold text-foreground">Everything your house needs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="flex flex-col gap-2">
                <Icon className="size-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Installation guide */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <h2 className="text-center text-xl font-semibold text-foreground">Installation guide</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="relative flex flex-col items-center gap-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {i + 1}. {title}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute top-6 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-4rem)] bg-border sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-10 text-center">
        <ShieldCheck className="size-8 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">You can trust this download</h2>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          <li>Downloaded directly from Cottage.</li>
          <li>APK uploaded by the Platform Administrator.</li>
          <li>No third-party modifications.</li>
        </ul>
      </section>

      {/* Device requirements */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <h2 className="text-center text-xl font-semibold text-foreground">Device requirements</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {REQUIREMENTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl bg-muted/50 px-3 py-4 text-center">
              <Icon className="size-5 text-primary" />
              <p className="text-xs font-medium text-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <h2 className="text-center text-xl font-semibold text-foreground">Frequently asked questions</h2>
        <FaqAccordion />
      </section>

      {/* Footer */}
      <footer className="mt-auto flex flex-col items-center gap-3 border-t border-border/60 px-6 py-8 text-center text-xs text-muted-foreground">
        {release && <p>Version {release.version}</p>}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-foreground hover:underline">
            Home
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Cottage. All rights reserved.</p>
      </footer>
    </div>
  );
}
