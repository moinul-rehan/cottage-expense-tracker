"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Megaphone, ShieldUser, Package } from "lucide-react";
import { Users } from "@/components/animate-ui/icons/users";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { ArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { cn } from "@/lib/utils";
import type { IconComponent } from "@/lib/icon-type";

// SnowUI's own icon set is Phosphor; the project already has lucide-react
// installed app-wide (not Phosphor), so this uses the closest lucide glyph
// per item rather than adding a second icon-library dependency.

type NavLink = { href: string; label: string; icon: IconComponent; matchPrefix?: string };

// Each feature gets its own equal-weight entry (no "Dashboards"/"Manage"
// grouping) so Cottages/Users/Notifications/Feedback read as distinct
// destinations rather than nested under a catch-all label.
const FEATURE_LINKS: NavLink[] = [
  { href: "/platform-admin", label: "Cottages", icon: House, matchPrefix: "/platform-admin/cottages" },
  { href: "/platform-admin/users", label: "Users", icon: Users },
  { href: "/platform-admin/notifications", label: "Notifications", icon: Megaphone },
  { href: "/platform-admin/feedback", label: "Feedback", icon: MessageSquareWarning },
  { href: "/platform-admin/releases", label: "App Releases", icon: Package },
];

function NavLinkItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 rounded-xl p-2 text-sm text-black transition-colors dark:text-white",
        active ? "bg-black/4 dark:bg-white/10" : "hover:bg-black/4 dark:hover:bg-white/10"
      )}
    >
      <link.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
      {link.label}
    </Link>
  );
}

/** [isOwner]: only owners (the env PLATFORM_ADMIN_EMAILS allowlist) manage
 * moderators - a moderator has the same power as an owner over every other
 * section here, but not over this one. See requirePlatformOwner in
 * src/lib/platform-admin.ts. */
export function AdminSidebarNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  const isActive = (link: NavLink) =>
    pathname === link.href || (link.matchPrefix && pathname.startsWith(link.matchPrefix));

  return (
    <nav className="flex flex-col gap-1 pb-3">
      <div className="flex flex-col gap-1 pb-3">
        {FEATURE_LINKS.map((link) => (
          <NavLinkItem key={link.label} link={link} active={!!isActive(link)} />
        ))}
      </div>

      {isOwner && (
        <div className="flex flex-col gap-1 pb-3">
          <p className="rounded-xl px-3 py-1 text-sm text-black/40 dark:text-white/40">Access</p>
          <NavLinkItem
            link={{ href: "/platform-admin/moderators", label: "Moderators", icon: ShieldUser }}
            active={pathname.startsWith("/platform-admin/moderators")}
          />
        </div>
      )}

      <Link
        href="/dashboard"
        className="mt-2 flex items-center gap-2 rounded-xl p-2 text-sm text-black/60 transition-colors hover:bg-black/4 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <ArrowLeft size={20} />
        Back to app
      </Link>
    </nav>
  );
}
