import { Receipt, HandCoins, Wallet, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

// Reserved space below the greeting that the summary card overlaps into --
// tuned so the card's negative top margin pulls it up roughly to its own
// vertical middle, keeping brand color visible behind its top half.
const OVERLAP = "14rem";

/** Mobile-only greeting hero + floating summary card, styled after the Rento
 * Figma kit's home screen: brand-color band (continuous with PageHeader
 * above it) bleeding behind the top half of a shadow-elevated white card,
 * centered greeting, icon-led borderless summary rows. Bottom nav is
 * untouched. Hidden on sm+ where the desktop header already carries the
 * greeting. */
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
      <div className="bg-primary px-6 pt-6 text-center text-primary-foreground" style={{ paddingBottom: OVERLAP }}>
        <p className="flex items-center justify-center gap-1.5 text-2xl font-bold">
          Welcome, {displayName}
          <VerifiedBadge {...profile} />
        </p>
        <p className="text-sm text-primary-foreground/80">
          Here&apos;s where things stand for <span className="font-bold">{monthLabel}</span>.
        </p>
      </div>

      <div className="px-4" style={{ marginTop: `calc(${OVERLAP} * -1)` }}>
        <div className="flex flex-col gap-4 rounded-[24px] bg-card p-5 shadow-[0px_6px_16px_rgba(28,32,43,0.08)]">
          <SummaryGroup
            title="Utility"
            rows={[
              { icon: Receipt, label: "Assigned Cost", value: `${utility.assignedCost.toFixed(2)} tk` },
              { icon: HandCoins, label: "Paid", value: `${utility.paid.toFixed(2)} tk` },
              {
                icon: Wallet,
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
              { icon: UtensilsCrossed, label: "Meal Cost", value: `${meal.cost.toFixed(2)} tk` },
              { icon: HandCoins, label: "Deposit", value: `${meal.deposit.toFixed(2)} tk` },
              {
                icon: Wallet,
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
  rows: { icon: LucideIcon; label: string; value: string; tone?: "positive" | "negative" }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex h-12 items-center gap-3 rounded-[10px] bg-muted/40 px-3 text-sm">
          <row.icon className="size-4 shrink-0 text-primary" />
          <span className="flex-1 text-muted-foreground">{row.label}</span>
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
