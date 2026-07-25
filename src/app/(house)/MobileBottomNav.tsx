"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pin, UtensilsCrossed, Zap, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/notice-board", label: "Notices", icon: Pin },
  { href: "/meal/month-details", label: "Meal", icon: UtensilsCrossed, matchPrefix: "/meal" },
  { href: "/utilities", label: "Utilities", icon: Zap, matchPrefix: "/utilities" },
] as const;

// Everything else lives behind the sidebar sheet (Members, Months, Contact,
// Settings) — the "Menu" tab highlights when one of those is open.
const MENU_PREFIXES = ["/members", "/months", "/contacts", "/settings"];

/** Mobile-only bottom tab bar that replaces the hamburger + slide-out
 * sidebar as the primary nav surface on small screens. "Menu" reuses the
 * existing Sidebar sheet (and everything nested in it — quick-add dialogs
 * included) rather than duplicating that logic. */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar, openMobile } = useSidebar();

  const menuActive = !openMobile && MENU_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const prefix = "matchPrefix" in tab ? tab.matchPrefix : tab.href;
        const active = !openMobile && (pathname === tab.href || pathname.startsWith(`${prefix}/`));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={toggleSidebar}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
          menuActive || openMobile ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Menu className="size-5" />
        Menu
      </button>
    </nav>
  );
}
