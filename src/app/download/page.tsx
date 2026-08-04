import { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format-date";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingBasket,
  Receipt,
  Users,
  Calculator,
  Bell,
  Zap,
  WifiOff,
  HelpCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
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

  return (
    <div className="min-h-screen bg-[#0E1015] text-white selection:bg-primary selection:text-white">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0E1015]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="https://cottagee.me/logo.png"
              alt="Cottage"
              className="size-8 rounded-lg object-cover ring-1 ring-white/20"
            />
            <span className="text-lg font-bold tracking-tight text-white">Cottage</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Create Cottage
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Error Notification Banner if download fails */}
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-300">
            <HelpCircle className="size-5 shrink-0 text-amber-400" />
            <span>No active APK release is currently available for direct download. Please try again later.</span>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-6 sm:p-12">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            {/* Top Badge */}
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Native Android Application</span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Download Cottage
            </h1>
            <p className="mt-4 text-lg text-white/70 sm:text-xl font-normal leading-relaxed">
              Manage your cottage from anywhere. Track meals, utilities, balances, and notifications in one place.
            </p>

            {/* Interactive Platform Detection & CTA Component */}
            <DownloadClientFeatures activeRelease={activeRelease} />
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Everything you need for shared-house living
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Built specifically for cottage managers and housemates to eliminate financial friction.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={UtensilsCrossed}
              title="Meal Tracking"
              description="Log daily meal counts, compute monthly meal totals, and calculate exact meal rates seamlessly."
              color="text-amber-400"
              bgColor="bg-amber-400/10"
            />
            <FeatureCard
              icon={ShoppingBasket}
              title="Bazaar Management"
              description="Record member bazaar cash deposits, grocery expenses, and automate bazaar duty schedules."
              color="text-emerald-400"
              bgColor="bg-emerald-400/10"
            />
            <FeatureCard
              icon={Receipt}
              title="Utility Management"
              description="Split electricity, gas, water, internet, maid, and rent costs with complete breakdown transparency."
              color="text-blue-400"
              bgColor="bg-blue-400/10"
            />
            <FeatureCard
              icon={Users}
              title="Member Management"
              description="Assign room labels, roles, and set custom action permissions for every member in the house."
              color="text-purple-400"
              bgColor="bg-purple-400/10"
            />
            <FeatureCard
              icon={Calculator}
              title="Smart Due Calculation"
              description="Instant net balance calculations carrying over monthly unpaid debts and extra credits."
              color="text-indigo-400"
              bgColor="bg-indigo-400/10"
            />
            <FeatureCard
              icon={Bell}
              title="Notifications"
              description="Real-time push alerts for notice board posts, cost requests, and deposit confirmations."
              color="text-pink-400"
              bgColor="bg-pink-400/10"
            />
            <FeatureCard
              icon={Zap}
              title="Real-time Updates"
              description="Instant live sync across web and mobile apps—no manual page refresh required."
              color="text-cyan-400"
              bgColor="bg-cyan-400/10"
            />
            <FeatureCard
              icon={WifiOff}
              title="Offline-friendly"
              description="Fast, optimized performance that keeps your data accessible even on low connectivity."
              color="text-orange-400"
              bgColor="bg-orange-400/10"
            />
          </div>
        </section>

        {/* INSTALLATION GUIDE */}
        <section className="mt-20 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10">
          <div className="text-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Simple 5-Step Process
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              How to Install the APK
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            <StepItem
              step={1}
              title="Download APK"
              description="Click 'Download for Android' to get the latest APK file."
            />
            <StepItem
              step={2}
              title="Open File"
              description="Tap the downloaded APK file in your phone downloads or notification bar."
            />
            <StepItem
              step={3}
              title="Allow Unknown Apps"
              description="If prompted, enable 'Allow from this source' in your browser/device settings."
            />
            <StepItem
              step={4}
              title="Install Cottage"
              description="Tap 'Install' and wait a few seconds for installation to complete."
            />
            <StepItem
              step={5}
              title="Sign In & Use"
              description="Open Cottage, sign in to your account, and manage your house!"
            />
          </div>
        </section>

        {/* SECURITY & TRUST SECTION */}
        <section className="mt-16 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="size-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Direct & Trusted Distribution</h3>
              <p className="mt-1 text-sm text-white/70">
                This APK is built directly from our source code and uploaded by the Platform Administrator.
                No third-party modifications, no ad networks, and no hidden tracking scripts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="size-3.5" /> 100% Authentic
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Admin Verified
              </span>
            </div>
          </div>
        </section>

        {/* DEVICE REQUIREMENTS & FAQ GRID */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Requirements */}
          <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="size-5 text-primary" />
              Device Requirements
            </h3>
            <div className="mt-4 divide-y divide-white/10 text-sm">
              <div className="flex items-center justify-between py-3">
                <span className="text-white/60">Operating System</span>
                <span className="font-semibold text-white">Android 9.0+</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-white/60">Minimum RAM</span>
                <span className="font-semibold text-white">3 GB RAM</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-white/60">Network</span>
                <span className="font-semibold text-white">Internet Connection</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-white/60">Storage Required</span>
                <span className="font-semibold text-white">~50 MB free space</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-white/60">Google Play Services</span>
                <span className="font-semibold text-emerald-400">Optional</span>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              Frequently Asked Questions
            </h3>

            <div className="mt-4 space-y-4">
              <FaqItem
                question="Is this APK safe to install?"
                answer="Yes! This APK is official, compiled directly from the Cottage platform codebase, and hosted securely on our servers without third-party modifications."
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
              <FaqItem
                question="Can I install this version over an older version?"
                answer="Yes. Simply open the new APK file and tap 'Update' when prompted by Android."
              />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-white/10 bg-[#0A0C0F] py-8 text-center text-xs text-white/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span>Cottage Android App</span>
            <span>•</span>
            <span className="font-semibold text-white/70">v{activeRelease?.version}</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase font-bold text-white/60">
              {activeRelease?.channel}
            </span>
          </div>

          <div className="flex items-center gap-4 text-white/60">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/privacy" className="hover:text-white">Terms of Service</Link>
            <a href="mailto:support@cottagee.me" className="hover:text-white">Contact Support</a>
          </div>

          <p>© 2026 Cottage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-white/20 hover:bg-white/[0.04]">
      <div className={`mb-4 flex size-10 items-center justify-center rounded-xl ${bgColor} ${color}`}>
        <Icon className="size-5" />
      </div>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

function StepItem({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary font-extrabold text-white text-sm shadow-md shadow-primary/30">
        {step}
      </div>
      <h4 className="font-semibold text-sm text-white">{title}</h4>
      <p className="mt-1 text-xs text-white/50 leading-normal">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all [&[open]]:bg-white/[0.05]">
      <summary className="flex cursor-pointer items-center justify-between font-semibold text-sm text-white list-none">
        <span>{question}</span>
        <ChevronDown className="size-4 text-white/40 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-xs leading-relaxed text-white/60">{answer}</p>
    </details>
  );
}
