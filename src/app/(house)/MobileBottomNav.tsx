"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pin, UtensilsCrossed, Zap, Menu } from "lucide-react";
import { MobileMealSheet } from "./MobileMealSheet";
import { MobileUtilitiesSheet } from "./MobileUtilitiesSheet";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { cn } from "@/lib/utils";

type Member = { id: string; first_name: string; last_name: string | null };

const MEAL_PREFIX = "/meal";
const UTILITIES_PREFIX = "/utilities";
const MENU_PREFIXES = ["/members", "/months", "/contacts", "/settings"];

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );
}

/** Mobile-only bottom tab bar that replaces the hamburger + slide-out
 * sidebar as the primary nav surface on small screens. Every tab that
 * needs sub-options (Meal, Utilities, Menu) opens a bottom sheet anchored
 * just above this bar — z-40, higher than the sheets' z-50 overlay but the
 * bar itself sits fixed at the very bottom, so it stays visible the whole
 * time instead of being covered like the old full-screen sidebar sheet. */
export function MobileBottomNav({
  members,
  defaultDate,
  canAddBazaar,
  canAddMeals,
  canAddDeposit,
  isSuperAdmin,
}: {
  members: Member[];
  defaultDate: string;
  canAddBazaar: boolean;
  canAddMeals: boolean;
  canAddDeposit: boolean;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const [mealOpen, setMealOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const anySheetOpen = mealOpen || utilitiesOpen || menuOpen;
  const mealActive = !anySheetOpen && (pathname === MEAL_PREFIX || pathname.startsWith(`${MEAL_PREFIX}/`));
  const utilitiesActive =
    !anySheetOpen && (pathname === UTILITIES_PREFIX || pathname.startsWith(`${UTILITIES_PREFIX}/`));
  const menuActive = !anySheetOpen && MENU_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-[60] flex h-16 items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
            !anySheetOpen && pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="size-5" />
          Home
        </Link>
        <Link
          href="/notice-board"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium",
            !anySheetOpen && pathname === "/notice-board" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Pin className="size-5" />
          Notices
        </Link>
        <TabButton icon={UtensilsCrossed} label="Meal" active={mealActive || mealOpen} onClick={() => setMealOpen(true)} />
        <TabButton icon={Zap} label="Utilities" active={utilitiesActive || utilitiesOpen} onClick={() => setUtilitiesOpen(true)} />
        <TabButton icon={Menu} label="Menu" active={menuActive || menuOpen} onClick={() => setMenuOpen(true)} />
      </nav>

      <MobileMealSheet
        open={mealOpen}
        onOpenChange={setMealOpen}
        members={members}
        defaultDate={defaultDate}
        canAddBazaar={canAddBazaar}
        canAddMeals={canAddMeals}
        canAddDeposit={canAddDeposit}
      />
      <MobileUtilitiesSheet
        open={utilitiesOpen}
        onOpenChange={setUtilitiesOpen}
        members={members}
        defaultDate={defaultDate}
        isSuperAdmin={isSuperAdmin}
      />
      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
