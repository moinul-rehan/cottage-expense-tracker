"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, Home, ShieldCheck } from "lucide-react";
import { User } from "@/components/animate-ui/icons/user";
import { cn } from "@/lib/utils";

const ICONS = { user: User, banknote: Banknote, home: Home, "shield-check": ShieldCheck } as const;

export type SettingsLink = { href: string; label: string; icon: keyof typeof ICONS };

export function SettingsNav({ links }: { links: SettingsLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border p-1 sm:w-48 sm:flex-col sm:flex-nowrap">
      {links.map((link) => {
        const active = pathname === link.href;
        const Icon = ICONS[link.icon];
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
