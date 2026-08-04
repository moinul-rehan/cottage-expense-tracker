"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Mail, Megaphone, ShieldUser } from "lucide-react";
import { Users } from "@/components/animate-ui/icons/users";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { ArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { cn } from "@/lib/utils";
import type { IconComponent } from "@/lib/icon-type";

type NavLink = { href: string; label: string; icon: IconComponent; matchPrefix?: string };

const FEATURE_LINKS: NavLink[] = [
  { href: "/platform-admin", label: "Cottages", icon: House, matchPrefix: "/platform-admin/cottages" },
  { href: "/platform-admin/users", label: "Users", icon: Users },
  { href: "/platform-admin/email", label: "Send Email", icon: Mail },
  { href: "/platform-admin/notifications", label: "Notifications", icon: Megaphone },
  { href: "/platform-admin/feedback", label: "Feedback", icon: MessageSquareWarning },
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

export function AdminSidebarNav({ isOwner }: { isOwner?: boolean }) {
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
