"use client";

import { usePathname } from "next/navigation";
import { Users, CalendarRange, Contact, Settings as SettingsIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SheetActionRow } from "./SheetActionRow";

const ITEMS = [
  { href: "/members", label: "Members", icon: Users },
  { href: "/months", label: "Months", icon: CalendarRange },
  { href: "/contacts", label: "Contact", icon: Contact },
  { href: "/settings/profile", label: "Settings", icon: SettingsIcon },
] as const;

/** Bottom-nav "Menu" destination on mobile — everything that doesn't get
 * its own tab (Members, Months, Contact, Settings), as a bottom sheet
 * instead of the full-screen sidebar sheet. */
export function MobileMenuSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl data-[side=bottom]:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-4 pb-6">
          {ITEMS.map((item) => (
            <SheetActionRow
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              onClick={() => onOpenChange(false)}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
