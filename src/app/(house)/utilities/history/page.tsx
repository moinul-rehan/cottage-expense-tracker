import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getMonthlyExpenseHistory,
  getUtilityDepositHistory,
  getCottageBalance,
  getMonthlyDues,
  getMonthlyExpenseTotal,
} from "@/lib/data/finance";
import { getActiveMonthKey, formatMonthKey } from "@/lib/data/months";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format-date";
import { Download } from "lucide-react";
import { UtilityDetailsMobile } from "./UtilityDetailsMobile";

const TABS = [
  { value: "expense", label: "Expense History" },
  { value: "member", label: "Member Deposit History" },
  { value: "cottage", label: "Cottage Deposit History" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default async function UtilityHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: TabValue = TABS.some((t) => t.value === tabParam) ? (tabParam as TabValue) : "expense";

  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const [{ data: members }, expenses, deposits, cottageBalance, totalUtilityExpense, dues] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getMonthlyExpenseHistory(supabase, monthKey),
    getUtilityDepositHistory(supabase, profile.cottage_id, monthKey),
    getCottageBalance(supabase, profile.cottage_id),
    getMonthlyExpenseTotal(supabase, monthKey),
    getMonthlyDues(supabase, profile.cottage_id, monthKey),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));
  const memberDeposits = deposits.filter((d) => d.source_type === "member");
  const cottageDeposits = deposits.filter((d) => d.source_type === "addition");
  const outstandingFromMembers = Array.from(dues.values()).reduce((sum, d) => sum + Math.max(0, d.due), 0);
  const collectedThisMonth = Array.from(dues.values()).reduce((sum, d) => sum + d.paid, 0);

  const canDownloadHistory = profile.role === "super_admin" || profile.can_add_expenses;

  return (
    <>
      <UtilityDetailsMobile
        monthLabel={formatMonthKey(monthKey)}
        activeTab={tab}
        canDownload={canDownloadHistory}
        expenses={expenses}
        memberDeposits={memberDeposits}
        cottageDeposits={cottageDeposits}
        membersById={membersById}
      />

      <div className="hidden flex-col gap-6 sm:flex">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Utility Details - <span className="font-bold text-primary">{formatMonthKey(monthKey)}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only record of every utility expense and deposit. No calculations happen here.
          </p>
        </div>
        {canDownloadHistory && (
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/utilities/history/pdf" download />}
            className="shrink-0 gap-1.5"
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Utility overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-0">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Cottage Balance
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">{cottageBalance.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 text-xs text-muted-foreground">
              Previous + deposits - cottage-paid expenses
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Total Utility Expense
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">{totalUtilityExpense.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 text-xs text-muted-foreground">
              Total shared expenses of this month
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Outstanding From Members
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">{outstandingFromMembers.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 text-xs text-muted-foreground">
              Total remaining amount members still need to pay
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0">
              <CardDescription className="text-xs font-medium tracking-wide uppercase">
                Collected This Month
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">{collectedThisMonth.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent className="pt-1 text-xs text-muted-foreground">
              Total amount collected from members this month
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/utilities/history?tab=${t.value}`}
            className={cn(
              "rounded-md px-2.5 py-1",
              tab === t.value ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "expense" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{formatDate(e.expense_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{UTILITY_CATEGORY_LABELS[e.category] ?? e.category}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">{e.description ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.payment_source === "cottage_balance"
                      ? "Cottage Balance"
                      : e.payment_source === "member"
                        ? "Member" + (e.payer ? " - " + getDisplayName(e.payer) : "")
                        : "None"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{e.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!expenses.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No utility expenses for {formatMonthKey(monthKey)} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === "member" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberDeposits.map((d) => {
                const member = d.user_id ? membersById.get(d.user_id) : null;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{member ? getDisplayName(member) : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(d.deposit_date)}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">{d.note ?? "-"}</TableCell>
                    <TableCell className="text-right font-medium">{d.amount.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              {!memberDeposits.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No Member Utility Deposits for {formatMonthKey(monthKey)} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === "cottage" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cottageDeposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{d.deposit_date}</TableCell>
                  <TableCell className="text-muted-foreground">{d.note ?? "-"}</TableCell>
                  <TableCell className="text-right font-medium">{d.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!cottageDeposits.length && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    No Cottage Deposits for {formatMonthKey(monthKey)} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
      </div>
    </>
  );
}
