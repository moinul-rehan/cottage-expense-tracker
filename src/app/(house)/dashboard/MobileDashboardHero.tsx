import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/verified-badge";

type BadgeProfile = {
  role: "super_admin" | "member";
  can_add_expenses: boolean;
  can_add_bazaar: boolean;
  can_add_meals: boolean;
  can_add_deposit: boolean;
  can_add_notice: boolean;
};

/** Mobile-only greeting hero + floating summary card, styled after the Rento
 * Figma kit's home screen (colored hero band, white card overlapping its
 * bottom edge, bg-muted "input-chrome" rows). Brand color and the existing
 * bottom nav are untouched -- only the hero/card layout and shadow/spacing
 * language are borrowed. Hidden on sm+ where the desktop header already
 * carries the greeting. */
export function MobileDashboardHero({
  displayName,
  profile,
  monthLabel,
  utility,
  meal,
}: {
  displayName: string;
  profile: BadgeProfile;
  monthLabel: string;
  utility: { assignedCost: number; paid: number; due: number };
  meal: { cost: number; deposit: number; balance: number };
}) {
  return (
    <div className="-mx-4 sm:hidden">
      <div className="rounded-b-[32px] bg-primary px-6 pt-6 pb-16 text-primary-foreground">
        <p className="flex items-center gap-1.5 text-2xl font-bold">
          Welcome, {displayName}
          <VerifiedBadge {...profile} />
        </p>
        <p className="text-sm text-primary-foreground/80">
          Here&apos;s where things stand for <span className="font-bold">{monthLabel}</span>.
        </p>
      </div>

      <div className="-mt-10 px-4">
        <div className="flex flex-col gap-4 rounded-[24px] bg-card p-5 shadow-[0px_6px_16px_rgba(28,32,43,0.08)] ring-1 ring-foreground/5">
          <SummaryGroup
            title="Utility"
            rows={[
              { label: "Assigned Cost", value: `${utility.assignedCost.toFixed(2)} tk` },
              { label: "Paid", value: `${utility.paid.toFixed(2)} tk` },
              {
                label: utility.due < 0 ? "Advance Balance" : "Remaining Due",
                value: `${Math.abs(utility.due).toFixed(2)} tk`,
                tone: utility.due > 0 ? "negative" : "positive",
              },
            ]}
          />
          <div className="h-px bg-border" />
          <SummaryGroup
            title="Meal"
            rows={[
              { label: "Meal Cost", value: `${meal.cost.toFixed(2)} tk` },
              { label: "Deposit", value: `${meal.deposit.toFixed(2)} tk` },
              {
                label: "Balance",
                value: `${meal.balance.toFixed(2)} tk`,
                tone: meal.balance < 0 ? "negative" : "positive",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryGroup({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; tone?: "positive" | "negative" }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex h-12 items-center justify-between rounded-[10px] border border-border bg-muted/40 px-3 text-sm"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span
            className={cn(
              "font-semibold text-foreground",
              row.tone === "negative" && "text-destructive",
              row.tone === "positive" && "text-emerald-600"
            )}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
