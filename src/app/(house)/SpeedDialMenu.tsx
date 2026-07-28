"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
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

export type SpeedDialOrigin = { x: number; y: number };

export const SPEED_DIAL_EXPAND_MS = 320;
export const SPEED_DIAL_COLLAPSE_MS = 260;
export const SPEED_DIAL_STAGGER_MS = 50;
export const SPEED_DIAL_EASE_OUT_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // slight overshoot on expand
export const SPEED_DIAL_EASE_IN_CUBIC = "cubic-bezier(0.32, 0, 0.67, 0)";

/** Radial "speed dial" pop-out for a bottom-nav tab. Each pill originates
 * from the trigger button's actual on-screen position (measured via
 * getBoundingClientRect, passed in as `origin`) and translates+scales+fades
 * to its resting spot in the stack, staggered closest-first on expand and
 * reversed (top item first) on collapse — so every item reads as physically
 * emerging from, and retracting back into, the button that opened it. */
export function SpeedDialMenu({
  open,
  onClose,
  items,
  align = "center",
  origin,
}: {
  open: boolean;
  onClose: () => void;
  items: SpeedDialItem[];
  align?: "start" | "center" | "end";
  origin: SpeedDialOrigin | null;
}) {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  // Each pill's resting center, measured ONCE while at rest (mount time,
  // when transform is always translate(0,0) — see the `offset` fallback
  // below). getBoundingClientRect reflects whatever transform is currently
  // applied, so measuring at any other time — e.g. re-measuring on every
  // open — would read the pill's already-displaced position from the
  // previous close and compound errors on every subsequent open. Centers
  // don't move once laid out, so measuring once and reusing is also just
  // cheaper.
  const [restingCenters, setRestingCenters] = useState<SpeedDialOrigin[]>([]);

  useLayoutEffect(() => {
    setRestingCenters(
      items.map((_, i) => {
        const el = itemRefs.current[i];
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/10 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style={{ transitionDuration: `${open ? SPEED_DIAL_EXPAND_MS : SPEED_DIAL_COLLAPSE_MS}ms` }}
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
          const center = restingCenters[i];
          const offset = origin && center ? { x: origin.x - center.x, y: origin.y - center.y } : { x: 0, y: 0 };
          const reverseIndex = items.length - 1 - i;
          const delay = (open ? i : reverseIndex) * SPEED_DIAL_STAGGER_MS;

          const style: CSSProperties = {
            transitionProperty: "transform, opacity",
            transitionDuration: `${open ? SPEED_DIAL_EXPAND_MS : SPEED_DIAL_COLLAPSE_MS}ms`,
            transitionTimingFunction: open ? SPEED_DIAL_EASE_OUT_BACK : SPEED_DIAL_EASE_IN_CUBIC,
            transitionDelay: `${delay}ms`,
            transform: open ? "translate(0px, 0px) scale(1)" : `translate(${offset.x}px, ${offset.y}px) scale(0.3)`,
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
          };
          // touch-manipulation matters here specifically: without it, a tap
          // landing on the wide label area (vs. the small icon circle) can
          // get miscategorized by the browser as the start of a scroll/pan
          // gesture over the scrollable page behind this fixed-position
          // pill, silently cancelling the click. select-none matters too --
          // without it, a tap that lands on the label's plain text can get
          // captured as the start of a text-selection gesture instead of a
          // click, which is exactly what made the icon tappable but the
          // label dead.
          const rowClassName = "flex touch-manipulation select-none items-center gap-2.5 rounded-full border border-border bg-card py-2 pr-4 pl-2 shadow-lg will-change-transform";
          const setRef = (el: HTMLElement | null) => {
            itemRefs.current[i] = el;
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
              <Link key={item.key} ref={setRef} href={item.href} className={rowClassName} style={style} onClick={onClose}>
                {content}
              </Link>
            );
          }
          return (
            <button key={item.key} ref={setRef} type="button" className={rowClassName} style={style} onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </>
  );
}
