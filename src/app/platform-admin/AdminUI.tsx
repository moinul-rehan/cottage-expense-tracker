import { cn } from "@/lib/utils";

/** SnowUI/ByeWind design-system primitives, scoped to the platform-admin
 * section only. Deliberately NOT the shared shadcn/Rento-styled Button/Card
 * used by the rest of the app -- platform admin gets its own look (black
 * pill buttons, white bordered cards, black/x% opacity text scale, 8/12/16
 * radius steps) straight from the Figma tokens (Black/4%, Black/40%,
 * Black/20%, Radius/8, Radius/12, 14 Regular/Semibold). Falls back to the
 * main app's shared components (Select, Textarea, etc.) only where SnowUI's
 * kit didn't have an exportable equivalent within scope.
 */

export function AdminCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border-[0.5px] border-black/10 bg-white p-6 dark:border-white/10 dark:bg-[#0e0e10]",
        className
      )}
      {...props}
    />
  );
}

export function AdminCardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold text-black dark:text-white", className)} {...props} />;
}

const adminButtonVariants = {
  primary: "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80",
  outline:
    "border-[0.5px] border-black/10 bg-white text-black hover:bg-black/4 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/10",
  ghost: "text-black/60 hover:bg-black/4 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white",
  destructive: "bg-red-600 text-white hover:bg-red-600/85",
} as const;

export function AdminButton({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & { variant?: keyof typeof adminButtonVariants }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        adminButtonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function AdminInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border-[0.5px] border-black/10 bg-black/[0.02] px-3 text-sm text-black outline-none placeholder:text-black/40 focus-visible:border-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus-visible:border-white/30",
        className
      )}
      {...props}
    />
  );
}

export function AdminTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border-[0.5px] border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black outline-none placeholder:text-black/40 focus-visible:border-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus-visible:border-white/30",
        className
      )}
      {...props}
    />
  );
}

export function AdminSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-lg border-[0.5px] border-black/10 bg-black/[0.02] px-3 text-sm text-black outline-none focus-visible:border-black/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus-visible:border-white/30",
        className
      )}
      {...props}
    />
  );
}

const badgeTones = {
  neutral: "bg-black/4 text-black/60 dark:bg-white/10 dark:text-white/60",
  good: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
} as const;

export function AdminBadge({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium capitalize",
        badgeTones[tone],
        className
      )}
      {...props}
    />
  );
}
