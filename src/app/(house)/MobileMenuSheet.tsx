"use client";

import { Users, CalendarRange, Contact, Settings as SettingsIcon } from "lucide-react";
import { SpeedDialMenu, type SpeedDialItem } from "./SpeedDialMenu";

const ITEMS: SpeedDialItem[] = [
  { key: "settings", href: "/settings/profile", label: "Settings", icon: SettingsIcon, colorClass: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300" },
  { key: "contacts", href: "/contacts", label: "Contact", icon: Contact, colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  { key: "months", href: "/months", label: "Months", icon: CalendarRange, colorClass: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  { key: "members", href: "/members", label: "Members", icon: Users, colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
];

/** Bottom-nav "Menu" destination on mobile — everything that doesn't get
 * its own tab (Members, Months, Contact, Settings), as a speed-dial
 * pop-out instead of the full-screen sidebar sheet. */
export function MobileMenuSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <SpeedDialMenu open={open} onClose={() => onOpenChange(false)} items={ITEMS} align="end" />;
}
