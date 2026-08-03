"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartPie, Megaphone } from "lucide-react";
import { Users } from "@/components/animate-ui/icons/users";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { ArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { cn } from "@/lib/utils";
import type { IconComponent } from "@/lib/icon-type";

// SnowUI's own icon set is Phosphor; the project already has lucide-react
// installed app-wide (not Phosphor), so this uses the closest lucide glyph
// per item rather than adding a second icon-library dependency.

type NavLink = { href: string; label: string; icon: IconComponent; matchPrefix?: string };

const NAV_SECTIONS: { label: string; links: NavLink[] }[] = [
  {
    label: "Dashboards",
    links: [
      {
        href: "/platform-admin",
        label: "Overview",
        icon: ChartPie,
        matchPrefix: "/platform-admin/cottages",
      },
    ],
  },
  {
    label: "Manage",
    links: [
      { href: "/platform-admin/users", label: "Users", icon: Users },
      { href: "/platform-admin/notifications", label: "Notifications", icon: Megaphone },
      { href: "/platform-admin/feedback", label: "Feedback", icon: MessageSquareWarning },
    ],
  },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 pb-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1 pb-3">
          <p className="rounded-xl px-3 py-1 text-sm text-black/40 dark:text-white/40">{section.label}</p>
          {section.links.map((link) => {
            const active =
              pathname === link.href || (link.matchPrefix && pathname.startsWith(link.matchPrefix));
            return (
              <Link
                key={link.label}
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
          })}
        </div>
      ))}
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
