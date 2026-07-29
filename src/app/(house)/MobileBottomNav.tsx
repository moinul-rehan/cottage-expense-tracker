"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pin, Inbox, UtensilsCrossed, Zap, Menu, type LucideIcon } from "lucide-react";
import { MobileMealSheet } from "./MobileMealSheet";
import { MobileUtilitiesSheet } from "./MobileUtilitiesSheet";
import { MobileMenuSheet } from "./MobileMenuSheet";
import {
  SPEED_DIAL_EXPAND_MS,
  SPEED_DIAL_COLLAPSE_MS,
  SPEED_DIAL_EASE_OUT_BACK,
  SPEED_DIAL_EASE_IN_CUBIC,
  type SpeedDialOrigin,
} from "./SpeedDialMenu";
import { cn } from "@/lib/utils";

type Member = { id: string; first_name: string; last_name: string | null };
type SheetKey = "meal" | "utilities" | "menu";

const MEAL_PREFIX = "/meal";
const UTILITIES_PREFIX = "/utilities";
const MENU_PREFIXES = ["/members", "/months", "/contacts", "/settings"];

/** One tab: a plain outline icon at rest, or — when active — the same icon
 * pops up into a filled circle that overlaps the bar's top edge, with a
 * ring matching the page background so it reads as a cutout in the bar.
 * Uses the same easing/duration as the speed-dial pills so the trigger
 * button visibly moves in sync with whatever it's opening/closing. */
function NavTab({
  icon: Icon,
  label,
  active,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const inner = (
    <>
      <span
        className={cn(
          "flex items-center justify-center rounded-full",
          active
            ? "-mt-8 size-14 bg-primary text-primary-foreground shadow-lg ring-4 ring-background"
            : "size-9 text-neutral-400"
        )}
        style={{
          transitionProperty: "margin, width, height, box-shadow",
          transitionDuration: `${active ? SPEED_DIAL_EXPAND_MS : SPEED_DIAL_COLLAPSE_MS}ms`,
          transitionTimingFunction: active ? SPEED_DIAL_EASE_OUT_BACK : SPEED_DIAL_EASE_IN_CUBIC,
        }}
      >
        <Icon className={active ? "size-6" : "size-5"} />
      </span>
      <span className="sr-only">{label}</span>
    </>
  );

  const className = "relative flex h-full flex-1 items-center justify-center";

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick} aria-label={label}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick} aria-label={label}>
      {inner}
    </button>
  );
}

/** Mobile-only bottom tab bar that replaces the hamburger + slide-out
 * sidebar as the primary nav surface on small screens. Every tab that
 * needs sub-options (Meal, Utilities, Menu) opens a speed-dial pop-out
 * anchored just above this bar, originating from that tab's own on-screen
 * position (captured on tap via getBoundingClientRect). `activeSheet` is a
 * single value rather than three booleans so at most one dial — and one
 * highlighted tab — can ever be open at a time; tapping the already-open
 * tab closes it instead of reopening the same dial. */
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
  const [activeSheet, setActiveSheet] = useState<SheetKey | null>(null);
  const [origin, setOrigin] = useState<SpeedDialOrigin | null>(null);

  function toggleSheet(key: SheetKey, e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setActiveSheet((prev) => (prev === key ? null : key));
  }

  function closeSheet(key: SheetKey) {
    setActiveSheet((prev) => (prev === key ? null : prev));
  }

  const canManageMealRequests = canAddMeals || canAddBazaar;
  const menuPrefixes = canManageMealRequests ? [...MENU_PREFIXES, "/notice-board"] : MENU_PREFIXES;

  const anySheetOpen = activeSheet !== null;
  const mealActive = !anySheetOpen && (pathname === MEAL_PREFIX || pathname.startsWith(`${MEAL_PREFIX}/`));
  const utilitiesActive =
    !anySheetOpen && (pathname === UTILITIES_PREFIX || pathname.startsWith(`${UTILITIES_PREFIX}/`));
  const menuActive = !anySheetOpen && menuPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      <nav
        className="fixed inset-x-3 bottom-3 z-[60] flex h-16 touch-manipulation items-center justify-around overflow-visible rounded-[28px] bg-neutral-900 shadow-xl md:hidden"
        aria-label="Primary"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <NavTab
          icon={LayoutDashboard}
          label="Home"
          href="/dashboard"
          active={!anySheetOpen && pathname === "/dashboard"}
          onClick={() => setActiveSheet(null)}
        />
        {canManageMealRequests ? (
          <NavTab
            icon={Inbox}
            label="Request"
            href="/request"
            active={!anySheetOpen && pathname === "/request"}
            onClick={() => setActiveSheet(null)}
          />
        ) : (
          <NavTab
            icon={Pin}
            label="Notices"
            href="/notice-board"
            active={!anySheetOpen && pathname === "/notice-board"}
            onClick={() => setActiveSheet(null)}
          />
        )}
        <NavTab
          icon={UtensilsCrossed}
          label="Meal"
          active={mealActive || activeSheet === "meal"}
          onClick={(e) => toggleSheet("meal", e)}
        />
        <NavTab
          icon={Zap}
          label="Utilities"
          active={utilitiesActive || activeSheet === "utilities"}
          onClick={(e) => toggleSheet("utilities", e)}
        />
        <NavTab
          icon={Menu}
          label="Menu"
          active={menuActive || activeSheet === "menu"}
          onClick={(e) => toggleSheet("menu", e)}
        />
      </nav>

      <MobileMealSheet
        open={activeSheet === "meal"}
        onOpenChange={(open) => (open ? setActiveSheet("meal") : closeSheet("meal"))}
        origin={origin}
        members={members}
        defaultDate={defaultDate}
        canAddBazaar={canAddBazaar}
        canAddMeals={canAddMeals}
        canAddDeposit={canAddDeposit}
      />
      <MobileUtilitiesSheet
        open={activeSheet === "utilities"}
        onOpenChange={(open) => (open ? setActiveSheet("utilities") : closeSheet("utilities"))}
        origin={origin}
        members={members}
        defaultDate={defaultDate}
        isSuperAdmin={isSuperAdmin}
      />
      <MobileMenuSheet
        open={activeSheet === "menu"}
        onOpenChange={(open) => (open ? setActiveSheet("menu") : closeSheet("menu"))}
        origin={origin}
        showNoticeBoard={canManageMealRequests}
      />
    </>
  );
}
