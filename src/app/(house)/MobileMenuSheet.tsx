"use client";

import { Users, CalendarRange, Contact, Pin, Settings as SettingsIcon } from "lucide-react";
import { SpeedDialMenu, type SpeedDialItem, type SpeedDialOrigin } from "./SpeedDialMenu";

/** Bottom-nav "Menu" destination on mobile - everything that doesn't get
 * its own tab (Members, Months, Contact, Settings). When Request has taken
 * over the main nav's second slot (managers/admin), Notice Board moves in
 * here instead of being stranded off the bar entirely. */
export function MobileMenuSheet({
  open,
  onOpenChange,
  origin,
  showNoticeBoard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: SpeedDialOrigin | null;
  showNoticeBoard: boolean;
}) {
  const items: SpeedDialItem[] = [
    ...(showNoticeBoard
      ? [{ key: "notice-board", href: "/notice-board", label: "Notice Board", icon: Pin, colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" }]
      : []),
    { key: "settings", href: "/settings/profile", label: "Settings", icon: SettingsIcon, colorClass: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300" },
    { key: "contacts", href: "/contacts", label: "Contact", icon: Contact, colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
    { key: "months", href: "/months", label: "Months", icon: CalendarRange, colorClass: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
    { key: "members", href: "/members", label: "Members", icon: Users, colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  ];

  return <SpeedDialMenu open={open} onClose={() => onOpenChange(false)} items={items} align="end" origin={origin} />;
}
