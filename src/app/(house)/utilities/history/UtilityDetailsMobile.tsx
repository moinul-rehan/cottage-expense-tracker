import { Download } from "@/components/animate-ui/icons/download";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabTrigger, TabContent } from "@/components/ui/tab-transition";
import { InlineCardsSkeleton } from "@/components/page-skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { getDisplayName } from "@/lib/data/display-name";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { translate, type Lang } from "@/lib/i18n/dictionary";

type Member = { id: string; first_name: string; last_name: string | null };
type TabValue = "expense" | "member" | "cottage";

const TABS: { value: TabValue; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "member", label: "Member Deposit" },
  { value: "cottage", label: "Cottage Deposit" },
];

// Same reveal proportions as MonthDetailsMobile -- kept local rather than
// shared since the two components have no other coupling.
const PAD = "6.5rem";
const OVERLAP = "5rem";

const CHIP = "rounded-[10px] border border-border bg-muted/30";

// No edit/view dialogs exist for utility history (it's read-only), so
// unlike MonthDetailsMobile's DateRow this one never takes an `actions` slot.
function DateRow({ date }: { date: string }) {
  return (
    <div className={cn(CHIP, "flex h-11 items-center px-4 text-sm font-medium text-foreground")}>
      {formatDate(date)}
    </div>
  );
}

function TotalAmountRow({ amount }: { amount: number }) {
  return (
    <div className={cn(CHIP, "flex h-11 items-stretch text-sm")}>
      <span className="flex flex-1 items-center px-4 font-medium text-primary">Total Amount</span>
      <span className="flex flex-1 items-center justify-end border-l border-border px-4 font-semibold text-foreground">
        {amount.toFixed(2)} tk
      </span>
    </div>
  );
}

function MemberAvatar({ member }: { member: Member | null }) {
  return (
    <div className={cn(CHIP, "flex w-24 shrink-0 flex-col items-center justify-center gap-1 px-2 py-3")}>
      <Avatar size="sm" className="size-10">
        <AvatarImage src={undefined} alt={member ? getDisplayName(member) : ""} />
        <AvatarFallback>{member?.first_name[0]?.toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>
      <span className="truncate text-xs font-semibold text-primary">{member ? getDisplayName(member) : "-"}</span>
    </div>
  );
}

type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  payment_source: string;
  payer: { first_name: string; last_name: string | null } | null;
};
type DepositRow = { id: string; user_id: string | null; amount: number; deposit_date: string; note: string | null };

/** Mobile-only "Utility Details" screen, matching MonthDetailsMobile's
 * structure exactly (hero band + floating intro card + pill tabs + per-date
 * record cards) for the Expense/Member Deposit/Cottage Deposit tabs. This
 * page is read-only (no edit/view dialogs exist for utility history), so
 * cards show data only, no icon actions. Hidden on sm+, where the desktop
 * table stays as-is. */
export function UtilityDetailsMobile({
  monthLabel,
  activeTab,
  canDownload,
  expenses,
  memberDeposits,
  cottageDeposits,
  membersById,
  lang,
}: {
  monthLabel: string;
  activeTab: TabValue;
  canDownload: boolean;
  expenses: ExpenseRow[];
  memberDeposits: DepositRow[];
  cottageDeposits: DepositRow[];
  membersById: Map<string, Member>;
  lang: Lang;
}) {
  return (
    <div className="-mx-4 -mt-4 sm:hidden">
      <div className="bg-primary px-6 pt-6 text-primary-foreground" style={{ paddingBottom: PAD }}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl leading-tight font-bold">{translate(lang, "utility_details")}</h1>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
            {monthLabel}
          </span>
        </div>
      </div>

      <div className="px-4" style={{ marginTop: `calc(${OVERLAP} * -1)` }}>
        <div className="flex flex-col gap-4 rounded-[32px] bg-card p-5 shadow-[0px_2px_8px_rgba(28,32,43,0.05)]">
          <p className="text-sm text-muted-foreground">
            Read-only record of every utility expense and deposit. No calculations happen here.
          </p>
          {canDownload && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href="/utilities/history/pdf" download />}
              className="w-fit gap-1.5"
            >
              <Download className="size-4" />
              Download
            </Button>
          )}
          <div className="flex gap-2">
            {TABS.map((t) => (
              <TabTrigger
                key={t.value}
                href={`/utilities/history?tab=${t.value}`}
                value={t.value}
                activeValue={activeTab}
                activeClassName="flex-1 rounded-[12px] border py-2.5 text-center text-sm font-semibold transition-colors border-primary bg-primary text-primary-foreground shadow-sm"
                inactiveClassName="flex-1 rounded-[12px] border py-2.5 text-center text-sm font-semibold transition-colors border-border bg-muted/20 text-foreground hover:bg-muted/40"
              >
                {t.label}
              </TabTrigger>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      <TabContent skeleton={<InlineCardsSkeleton />}>
        {activeTab === "expense" &&
          (expenses.length ? (
            expenses.map((e) => (
              <div key={e.id} className="flex flex-col gap-3 rounded-[20px] bg-card p-3 shadow-[0_1px_3px_rgba(28,32,43,0.04)]">
                <DateRow date={e.expense_date} />
                <div className={cn(CHIP, "flex flex-col gap-1 px-3 py-2.5")}>
                  <span className="text-xs font-semibold text-primary">
                    {UTILITY_CATEGORY_LABELS[e.category] ?? e.category}
                  </span>
                  <span className="text-sm text-foreground">{e.description || "-"}</span>
                </div>
                <div className={cn(CHIP, "flex h-11 items-center justify-between px-4 text-sm")}>
                  <span className="text-muted-foreground">Payment Source</span>
                  <span className="font-medium text-foreground">
                    {e.payment_source === "cottage_balance"
                      ? "Cottage Balance"
                      : e.payment_source === "member"
                        ? "Member" + (e.payer ? " - " + getDisplayName(e.payer) : "")
                        : "None"}
                  </span>
                </div>
                <TotalAmountRow amount={e.amount} />
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No utility expenses yet.</p>
          ))}

        {activeTab === "member" &&
          (memberDeposits.length ? (
            memberDeposits.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 rounded-[20px] bg-card p-3 shadow-[0_1px_3px_rgba(28,32,43,0.04)]">
                <DateRow date={d.deposit_date} />
                <div className="flex items-stretch gap-2">
                  <MemberAvatar member={d.user_id ? (membersById.get(d.user_id) ?? null) : null} />
                  <div className={cn(CHIP, "flex flex-1 items-center px-3 py-3 text-sm text-muted-foreground italic")}>
                    {d.note || "-"}
                  </div>
                </div>
                <TotalAmountRow amount={d.amount} />
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No Member Utility Deposits yet.</p>
          ))}

        {activeTab === "cottage" &&
          (cottageDeposits.length ? (
            cottageDeposits.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 rounded-[20px] bg-card p-3 shadow-[0_1px_3px_rgba(28,32,43,0.04)]">
                <DateRow date={d.deposit_date} />
                <div className={cn(CHIP, "flex min-h-11 items-center px-4 py-2.5 text-sm text-muted-foreground italic")}>
                  {d.note || "-"}
                </div>
                <TotalAmountRow amount={d.amount} />
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No Cottage Deposits yet.</p>
          ))}
      </TabContent>
      </div>
    </div>
  );
}
