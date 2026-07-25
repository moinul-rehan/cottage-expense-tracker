"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** One tappable row inside a bottom-nav section sheet — icon chip + label,
 * either a route (Link) or an action (button, e.g. opens a dialog). */
export function SheetActionRow({
  icon: Icon,
  label,
  active,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-muted",
    active ? "bg-accent" : "hover:bg-muted"
  );

  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          active ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className={cn("text-sm font-medium", active ? "text-accent-foreground" : "text-foreground")}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}
