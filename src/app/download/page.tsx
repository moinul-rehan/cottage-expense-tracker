import { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format-date";
import {
  Smartphone,
  ShieldCheck,
  UtensilsCrossed,
  ShoppingBasket,
  Receipt,
  Users,
  Calculator,
  Bell,
  Zap,
  WifiOff,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DownloadClientFeatures } from "./DownloadClientFeatures";

export const metadata: Metadata = {
  title: "Download Cottage Android App | Shared House Expense Tracker",
  description:
    "Download the official Cottage Android app. Manage meals, utility expenses, bazaar deposits, and notifications for your shared house from anywhere.",
};

export type ActiveRelease = {
  version: string;
  sizeMb: string;
  releaseDate: string;
  channel: string;
  notes: string | null;
} | null;

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const admin = createAdminClient();

  const { data: release } = await admin
    .from("app_releases")
    .select("version, file_size_bytes, channel, created_at, published_at, release_notes")
    .eq("platform", "android")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeRelease: ActiveRelease = release
    ? {
        version: release.version,
        sizeMb: (Number(release.file_size_bytes || 0) / (1024 * 1024)).toFixed(1) + " MB",
        releaseDate: formatDate(release.published_at || release.created_at),
        channel: release.channel,
        notes: release.release_notes,
      }
    : {
        version: "1.0.3",
        sizeMb: "31.4 MB",
        releaseDate: "03 August 2026",
        channel: "beta",
        notes: "Performance improvements and real-time updates.",
      };

  const FEATURES = [
    {
      icon: UtensilsCrossed,
      title: "Meal tracking",
      description:
        "Log daily meal counts, compute monthly meal totals, and calculate exact meal rates seamlessly.",
    },
    {
      icon: ShoppingBasket,
      title: "Bazaar management",
      description:
        "Record member bazaar cash deposits, grocery expenses, and automate bazaar duty schedules.",
    },
    {
      icon: Receipt,
      title: "Utilities & shared bills",
      description:
        "Split electricity, gas, water, internet, maid, and rent costs with complete breakdown transparency.",
    },
    {
      icon: Users,
      title: "Members & permissions",
      description:
        "Assign room labels, roles, and set custom action permissions for every roommate in the house.",
    },
    {
      icon: Calculator,
      title: "Smart due calculation",
      description:
        "Instant net balance calculations carrying over monthly unpaid debts and advance credits.",
    },
    {
      icon: Bell,
      title: "Real-time notifications",
      description:
        "Everyone stays in sync automatically when a bill, notice, or settlement gets added.",
    },
    {
      icon: Zap,
      title: "Real-time updates",
      description:
        "Instant live sync across web and mobile apps—no manual page refresh required.",
    },
    {
      icon: WifiOff,
      title: "Offline-friendly",
      description:
        "Fast, optimized performance that keeps your cottage data accessible anywhere.",
    },
  ];

  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Logo size={30} />
            Cottage
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Log in
            </Button>
            <Button nativeButton={false} render={<Link href="/signup" />} className="rounded-full">
              Sign up free
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 0%, #FBEAE5 0%, rgba(251,234,229,0) 70%)",
            }}
          />
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
            {error && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 dark:text-amber-300">
                <HelpCircle className="size-5 shrink-0 text-amber-500" />
                <span>No active APK release is currently available for direct download. Please try again later.</span>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground sm:text-sm shadow-xs">
              <ShieldCheck className="size-3.5 text-primary sm:size-4" />
              Native Android Application • Admin Verified
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Download Cottage
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Manage your cottage from anywhere. Track meals, utilities, balances, and notifications in one place.
            </p>

            {/* Platform Detection & CTA */}
            <DownloadClientFeatures activeRelease={activeRelease} />
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything your house needs
            </h2>
            <p className="text-muted-foreground">
              Meals, bills and settle-ups - Cottage keeps every roommate&apos;s numbers straight, automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="gap-3 p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Installation Guide */}
        <section className="border-y border-border bg-card/40">
          <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
            <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                Simple Installation
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Up and running in 5 steps
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { step: "1", title: "Download APK", body: "Click Download for Android to get the latest APK file." },
                { step: "2", title: "Open File", body: "Tap the downloaded APK file in your phone downloads." },
                { step: "3", title: "Allow Installation", body: "Enable 'Allow from this source' if prompted." },
                { step: "4", title: "Install Cottage", body: "Tap Install and wait a few seconds." },
                { step: "5", title: "Sign In & Use", body: "Open Cottage, sign in, and manage your house!" },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Device Requirements & FAQ Grid */}
        <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Requirements */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <Smartphone className="size-3.5" /> Device Specifications
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Requirements
              </h3>
              <p className="text-sm text-muted-foreground">
                Cottage is lightweight and designed to run smoothly on any modern Android phone.
              </p>
              <div className="divide-y divide-border text-sm text-foreground">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Operating System</span>
                  <span className="font-semibold">Android 9.0+</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Minimum RAM</span>
                  <span className="font-semibold">3 GB RAM</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-semibold">Internet Required</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-semibold">~50 MB</span>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                <HelpCircle className="size-3.5" /> Help Center
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Frequently Asked Questions
              </h3>

              <div className="mt-2 space-y-3">
                <FaqItem
                  question="Is this APK safe to install?"
                  answer="Yes! This APK is official, compiled directly from the Cottage platform codebase, and hosted securely without third-party modifications."
                />
                <FaqItem
                  question="Do I need Google Play Store to run Cottage?"
                  answer="No. The application runs natively on Android without requiring Google Play Store services."
                />
                <FaqItem
                  question="Will my data remain intact when I update the app?"
                  answer="Yes. Your expense records, meal logs, bazaar deposits, and cottage settings are stored in the cloud. Updating or reinstalling the app keeps all your data safe."
                />
                <FaqItem
                  question="How do I update Cottage in the future?"
                  answer="You can visit this /download page anytime to download the newest APK, or check in-app update notifications."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-4xl px-6 pb-20 text-center sm:pb-24">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to simplify your cottage expenses?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Create your Cottage account or download the app today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              nativeButton={false}
              render={<a href="/download/latest" download />}
              className="h-12 rounded-full px-8 text-base"
            >
              Download APK
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/signup" />}
              className="h-12 rounded-full px-8 text-base"
            >
              Sign up for web
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Logo size={22} />
            Cottage
          </div>
          <p>Shared-house expense manager for every Cottage.</p>
          <Link href="/privacy" className="font-medium text-foreground hover:text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-card p-4 text-left transition-all">
      <summary className="flex cursor-pointer items-center justify-between font-semibold text-base text-foreground list-none">
        <span>{question}</span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  );
}
