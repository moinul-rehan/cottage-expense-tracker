"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsLink = { href: string; label: string; icon: LucideIcon };

export function SettingsNav({ links }: { links: SettingsLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 sm:w-48 sm:flex-col sm:flex-nowrap">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors sm:rounded-lg sm:justify-start",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            <link.icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
