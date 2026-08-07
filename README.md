<p align="center">
  <img src="public/logo.png" alt="Cottage logo" width="96" />
</p>

<h1 align="center">Cottage</h1>

<p align="center">
  <b>The shared-house operating system for roommates.</b><br />
  Meals, bazaar, utilities, dues, notices, and requests — one ledger everyone trusts.
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#platforms">Platforms</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#license">License</a>
</p>

---

## What is Cottage?

Cottage is a full-stack expense and household-management app built for a group of roommates ("a Cottage") sharing rent, meals, and utility bills. It replaces the messy spreadsheet-and-group-chat routine with a single source of truth: who bought what, who owes what, and who's on bazaar duty this week — updated in real time, in Bengali or English, on the web or from your phone.

Every house gets its own private Cottage: its own members, its own monthly ledgers, its own notice board. A lightweight platform-admin layer sits above all Cottages for moderation, support, and release management.

## Features

### 🍽️ Meal & Bazaar Tracking
- Log daily meal counts per member and let the app compute exact **meal rates** for the month automatically.
- Record bazaar (grocery) cash deposits and purchases, with running balances per member.
- Automated **bazaar duty roster** so the "who's cooking/shopping this week" question never comes up again.

### 🧾 Utilities & Shared Bills
- Split electricity, gas, water, internet, maid, and rent with a full itemized breakdown — no more "trust me" math.
- Carry-in adjustments so a partially-paid bill from last month rolls cleanly into the next statement.
- Downloadable **PDF statements** for both monthly meal records and utility history (`@react-pdf/renderer`).

### 💰 Smart Due Calculation
- Instant net-balance calculation per member: what's owed, what's advanced, and what carries forward — no manual bookkeeping.
- Month lifecycle management (activate a month, close it out, view historical months).

### 👥 Members & Permissions
- Room labels, roles, and per-action permissions — decide exactly who can approve requests, edit bills, or manage settings.
- Invite flow to bring new roommates into a Cottage.
- Owner-configurable **auto-approve** for new Cottages created at signup, vs. requiring manual approval.

### 📋 Requests & Approvals
- Roommates submit meal requests, meal-cost requests, and deposit requests; designated approvers action them from a single queue.
- Full audit trail — nothing changes the ledger without a paper trail.

### 📌 Notice Board
- House-wide notices with priority levels, visibility scoping, and scheduled publish/expiry.
- Pinned notices surface on the dashboard so nobody misses a rent-due reminder.

### 🔔 Real-Time Everything
- Supabase Realtime keeps every open tab/device in sync — a new bill or notice appears instantly, no refresh.
- Push notifications (Web Push + Firebase Cloud Messaging) reach members even when the app is closed.
- In-app notification center with read/unread state.

### 🌐 Bilingual (English/Bengali)
- First-class `bn`/`en` language toggle across navigation, actions, and page titles, with graceful English fallback for untranslated strings.
- Bundled Bengali web font (Noto Sans Bengali) so it renders correctly everywhere, including generated PDFs.

### 📱 Installable, Offline-Friendly PWA
- Full Progressive Web App manifest and service worker — "Add to Home Screen" on any device.
- Fast, cache-friendly performance that keeps core data usable even on flaky connections.

### 🛠️ Platform Admin Console
- Cross-Cottage oversight: approve/reject new Cottages, manage moderators, review user feedback.
- Broadcast notifications and platform-wide emails (multi-recipient) straight from the admin UI.
- Release management for the Android app, with the public `/download` page reading the latest build automatically.
- Scheduled cleanup (Vercel Cron) for expired/abandoned Cottages.

### 🔒 Auth & Security
- Email/password and Google OAuth via Supabase Auth, with dedicated flows for signup, login, password reset, and pending-approval states.
- Row-level security boundaries enforced at the data layer (`src/lib/data/dal.ts`) — every read/write is scoped to the caller's Cottage and role.

## Platforms

Cottage ships as three coordinated clients sharing one Supabase backend:

| Platform | Stack | Where |
|---|---|---|
| **Web app** | Next.js 16 (App Router) + PWA | this repo |
| **Android/iOS app** | Flutter | [`Cottage-App-Flutter`](https://github.com/moinul-rehan/Cottage-App-Flutter) — separate repo, distributed as a signed APK from `/download` |
| **Mobile (in progress)** | Expo / React Native | [`mobile/`](./mobile) in this repo |

The web app is the feature-complete reference implementation; the Flutter app mirrors its core screens (dashboard, meal, utilities, menu, notices, notifications) for native mobile use.

## Tech Stack

**Web**
- [Next.js 16](https://nextjs.org) (App Router, Server Actions, React 19)
- [Supabase](https://supabase.com) — Postgres, Auth, Realtime, Row-Level Security
- [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com)
- [Motion](https://motion.dev) for animation
- [@react-pdf/renderer](https://react-pdf.org) for statement/report PDFs
- [Resend](https://resend.com) for transactional email, [web-push](https://www.npmjs.com/package/web-push) + Firebase Admin for push notifications
- TypeScript throughout

**Mobile**
- Flutter (Dart) — production Android/iOS client, `supabase_flutter`, Firebase Messaging, Google Fonts
- Expo / React Native — early-stage companion app

**Data & Infra**
- Supabase Postgres with 48+ tracked migrations (`supabase/migrations`)
- Deployed on Vercel with a scheduled cron job for platform cleanup

## Architecture

```
                         ┌──────────────────────┐
                         │   Supabase (Postgres) │
                         │  Auth · RLS · Realtime │
                         └───────────┬───────────┘
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
       ┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼─────────┐
       │   Next.js Web App │ │  Flutter App   │ │  Expo (mobile/)  │
       │ (this repo, /src) │ │ (separate repo)│ │  early-stage     │
       └────────────────────┘ └────────────────┘ └──────────────────┘
```

Inside the web app, each Cottage's data (`src/lib/data/*.ts`) is accessed through a data-access layer that enforces membership and role checks before hitting Postgres — UI components never query Supabase directly for anything security-sensitive.

## Getting Started

```bash
npm install
cp env.json.example env.json   # or configure .env.local directly, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Platform admin allowlist (comma-separated emails)
PLATFORM_ADMIN_EMAILS=
```

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Project Structure

```
src/
  app/
    (house)/          # authenticated Cottage app: dashboard, meal, utilities, members, notices, requests, settings...
    platform-admin/   # cross-Cottage admin console
    login/ signup/ forgot-password/ reset-password/  # auth flows
    download/         # public Android app download page
    api/               # route handlers (cron, etc.)
  components/
    ui/               # shadcn/ui primitives
    animate-ui/       # animated icon set
  lib/
    data/             # data-access layer (per-domain: finance, meal, notice-board, notifications...)
    supabase/         # Supabase client/server/admin helpers
    i18n/             # bilingual dictionary + translate()
supabase/
  migrations/         # versioned Postgres schema (48+ migrations)
mobile/                # Expo/React Native companion app (early stage)
public/                # static assets, PWA icons, fonts
```

The Flutter client lives in its own repository, [`Cottage-App-Flutter`](https://github.com/moinul-rehan/Cottage-App-Flutter).

## License

This repository is public for portfolio/demonstration purposes only. All rights are reserved — see [LICENSE](./LICENSE). No permission is granted to copy, modify, distribute, or reuse this code without written consent.
