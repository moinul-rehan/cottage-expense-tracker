"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpeedDialItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  colorClass: string;
  href?: string;
  onClick?: () => void;
};

const EXPAND_DURATION_MS = 280;
const COLLAPSE_DURATION_MS = 200;
const STAGGER_MS = 50;
const EASE_OUT_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // slight overshoot on expand
const EASE_IN_CUBIC = "cubic-bezier(0.32, 0, 0.67, 0)";

/** Radial "speed dial" pop-out for a bottom-nav tab — a stack of pill
 * buttons (icon + label) that cascade in above the tab that triggered
 * them, closest item first, instead of a full bottom sheet. Expand
 * overshoots slightly (easeOutBack) and staggers 50ms/item; collapse is a
 * single quick easeInCubic fade with no stagger. */
export function SpeedDialMenu({
  open,
  onClose,
  items,
  align = "center",
}: {
  open: boolean;
  onClose: () => void;
  items: SpeedDialItem[];
  align?: "start" | "center" | "end";
}) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/10 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={{ transitionDuration: `${open ? EXPAND_DURATION_MS : COLLAPSE_DURATION_MS}ms` }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed bottom-[5.75rem] z-[55] flex flex-col-reverse gap-2 md:hidden",
          align === "start" && "left-3",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-3"
        )}
      >
        {items.map((item, i) => {
          const rowClassName = cn(
            "flex items-center gap-2.5 rounded-full border border-border bg-card py-2 pr-4 pl-2 shadow-lg transition-[transform,opacity]",
            open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-75 opacity-0"
          );
          const style = {
            transitionDuration: `${open ? EXPAND_DURATION_MS : COLLAPSE_DURATION_MS}ms`,
            transitionTimingFunction: open ? EASE_OUT_BACK : EASE_IN_CUBIC,
            transitionDelay: open ? `${i * STAGGER_MS}ms` : "0ms",
          };
          const content = (
            <>
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", item.colorClass)}>
                <item.icon className="size-4" />
              </span>
              <span className="text-sm font-medium whitespace-nowrap text-foreground">{item.label}</span>
            </>
          );

          if (item.href) {
            return (
              <Link key={item.key} href={item.href} className={rowClassName} style={style} onClick={onClose}>
                {content}
              </Link>
            );
          }
          return (
            <button key={item.key} type="button" className={rowClassName} style={style} onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </>
  );
}
