import Link from "next/link";
import { Download } from "@/components/animate-ui/icons/download";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { getDisplayName } from "@/lib/data/display-name";
import { EditMealRowDialog } from "./EditMealRowDialog";
import { EditDepositDialog } from "./EditDepositDialog";
import { EditBazaarDialog } from "./EditBazaarDialog";
import { ViewBazaarDialog } from "./ViewBazaarDialog";

type Member = { id: string; first_name: string; last_name: string | null };
type MemberRef = { first_name: string; last_name: string | null; avatar_url: string | null } | null;
type ViewValue = "meal" | "cost" | "deposit";

// Figma's own tab order/labels (Meal Details / Bazar / Deposit) -- kept
// local to this mobile view rather than touching the desktop VIEWS list,
// which stays "Meal Details / Deposit / Meal Cost" untouched.
const MOBILE_VIEWS: { value: ViewValue; label: string }[] = [
  { value: "meal", label: "Meal Details" },
  { value: "cost", label: "Bazar" },
  { value: "deposit", label: "Deposit" },
];

// Reserved space below the title that the intro card overlaps into (see
// MobileDashboardHero for the same pattern, smaller here to match the
// shallower overlap in the Rento reference).
const PAD = "6.5rem";
const OVERLAP = "5rem";

// Every chip in the reference (date pill, icon buttons, grid cells, avatar
// box, description/note box, total row) has a visible hairline border, not
// just a background tint -- this is what was missing from the first pass.
const CHIP = "rounded-[10px] border border-border bg-muted/30";

function IconActionBox({ children }: { children: React.ReactNode }) {
  return <div className={cn(CHIP, "flex h-11 w-11 shrink-0 items-center justify-center")}>{children}</div>;
}

function DateRow({ date, actions }: { date: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(CHIP, "flex h-11 flex-1 items-center px-4 text-sm font-medium text-foreground")}>
        {formatDate(date)}
      </div>
      {actions}
    </div>
  );
}

function MemberAvatar({ member }: { member: MemberRef }) {
  return (
    <div className={cn(CHIP, "flex w-24 shrink-0 flex-col items-center justify-center gap-1 px-2 py-3")}>
      <Avatar size="sm" className="size-10">
        <AvatarImage src={member?.avatar_url ?? undefined} alt={member ? getDisplayName(member) : ""} />
        <AvatarFallback>{member?.first_name[0]?.toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>
      <span className="truncate text-xs font-semibold text-primary">{member ? getDisplayName(member) : "-"}</span>
    </div>
  );
}

function EntryCard({
  date,
  actions,
  children,
  amount,
}: {
  date: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  amount: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-card p-3 shadow-[0_1px_3px_rgba(28,32,43,0.04)]">
      <DateRow date={date} actions={actions} />
      {children}
      <TotalAmountRow amount={amount} />
    </div>
  );
}

// The reference splits this row into two literal halves with a vertical
// divider between label and value, not just justify-between whitespace.
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

/** Mobile-only "Monthly Details" screen, styled after Rento's own Monthly
 * Details mock (hero band + floating intro card + pill tabs + per-date
 * record cards) for the Meal/Bazar/Deposit tabs. Reuses the exact same
 * data + Edit/View dialogs as the desktop table view -- only the layout
 * around them is new. Hidden on sm+, where the desktop table stays as-is. */
export function MonthDetailsMobile({
  monthLabel,
  activeView,
  canEditMeals,
  canEditBazaar,
  canEditDeposits,
  memberList,
  pivotRows,
  bazaarRecords,
  depositRecords,
}: {
  monthLabel: string;
  activeView: ViewValue;
  canEditMeals: boolean;
  canEditBazaar: boolean;
  canEditDeposits: boolean;
  memberList: Member[];
  pivotRows: { date: string; counts: number[] }[];
  bazaarRecords: { id: string; entry_date: string; amount: number; description: string | null; member: MemberRef }[];
  depositRecords: { id: string; deposit_date: string; amount: number; note: string | null; member: MemberRef }[];
}) {
  return (
    <div className="-mx-4 sm:hidden">
      <div className="bg-primary px-6 pt-6 text-primary-foreground" style={{ paddingBottom: PAD }}>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl leading-tight font-bold">Monthly Details</h1>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
            {monthLabel}
          </span>
        </div>
      </div>

      <div className="px-4" style={{ marginTop: `calc(${OVERLAP} * -1)` }}>
        <div className="flex flex-col gap-4 rounded-[32px] bg-card p-5 shadow-[0px_2px_8px_rgba(28,32,43,0.05)]">
          <p className="text-sm text-muted-foreground">
            Full meal, deposit and cost records for every member in the active month.
          </p>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/meal/month-details/pdf" download />}
            className="w-fit gap-1.5"
          >
            <Download className="size-4" />
            Download
          </Button>
          {/* Three independently-bordered pills, not one shared muted-bg
           * track -- matches the reference's segmented control exactly. */}
          <div className="flex gap-2">
            {MOBILE_VIEWS.map((v) => (
              <Link
                key={v.value}
                href={`/meal/month-details?view=${v.value}`}
                className={cn(
                  "flex-1 rounded-[12px] border py-2.5 text-center text-sm font-semibold transition-colors",
                  activeView === v.value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/20 text-foreground hover:bg-muted/40"
                )}
              >
                {v.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
        {activeView === "meal" &&
          (pivotRows.length ? (
            pivotRows.map((row) => (
              <div key={row.date} className="flex flex-col gap-3 rounded-[20px] bg-card p-3 shadow-[0_1px_3px_rgba(28,32,43,0.04)]">
                <DateRow
                  date={row.date}
                  actions={
                    canEditMeals && (
                      <IconActionBox>
                        <EditMealRowDialog date={row.date} members={memberList} counts={row.counts} />
                      </IconActionBox>
                    )
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  {memberList.map((m, i) => (
                    <div key={m.id} className={cn(CHIP, "flex flex-col items-center gap-1.5 px-2 py-3 text-center")}>
                      <span className="w-full truncate border-b border-border/70 pb-1.5 text-xs font-semibold text-primary">
                        {getDisplayName(m)}
                      </span>
                      <span className="text-base font-semibold text-foreground">{row.counts[i] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No meal entries yet.</p>
          ))}

        {activeView === "cost" &&
          (bazaarRecords.length ? (
            bazaarRecords.map((r) => (
              <EntryCard
                key={r.id}
                date={r.entry_date}
                amount={Number(r.amount)}
                actions={
                  <>
                    <IconActionBox>
                      <ViewBazaarDialog
                        entryDate={r.entry_date}
                        amount={Number(r.amount)}
                        description={r.description}
                        member={r.member}
                      />
                    </IconActionBox>
                    {canEditBazaar && (
                      <IconActionBox>
                        <EditBazaarDialog
                          id={r.id}
                          amount={Number(r.amount)}
                          entryDate={r.entry_date}
                          description={r.description}
                        />
                      </IconActionBox>
                    )}
                  </>
                }
              >
                <div className="flex items-stretch gap-2">
                  <MemberAvatar member={r.member} />
                  <div
                    className={cn(
                      "flex flex-1 items-center rounded-[10px] border border-accent-foreground/15 bg-accent px-3 py-3 text-sm text-accent-foreground"
                    )}
                  >
                    {r.description || "-"}
                  </div>
                </div>
              </EntryCard>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No bazaar entries yet.</p>
          ))}

        {activeView === "deposit" &&
          (depositRecords.length ? (
            depositRecords.map((r) => (
              <EntryCard
                key={r.id}
                date={r.deposit_date}
                amount={Number(r.amount)}
                actions={
                  canEditDeposits && (
                    <IconActionBox>
                      <EditDepositDialog id={r.id} amount={Number(r.amount)} depositDate={r.deposit_date} note={r.note} />
                    </IconActionBox>
                  )
                }
              >
                <div className="flex items-stretch gap-2">
                  <MemberAvatar member={r.member} />
                  <div className={cn(CHIP, "flex flex-1 items-center px-3 py-3 text-sm text-muted-foreground italic")}>
                    {r.note || "Auto credited from Bazar"}
                  </div>
                </div>
              </EntryCard>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No deposits yet.</p>
          ))}
      </div>
    </div>
  );
}
