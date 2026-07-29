import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey, defaultDateForMonth } from "@/lib/data/months";
import { getMemberMealSummary } from "@/lib/data/meal";
import { BazaarForm } from "./BazaarForm";
import { DepositForm } from "./DepositForm";
import { DailyMealForm } from "./DailyMealForm";
import { CancelMealRequestButton } from "./CancelMealRequestButton";
import { CancelMealCostRequestButton } from "./CancelMealCostRequestButton";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function MealPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);
  const defaultDate = defaultDateForMonth(monthKey);

  const { data: members } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("last_name");

  const { rows, mealRate, totalBazaar, totalMeals } = await getMemberMealSummary(
    supabase,
    monthKey,
    members ?? []
  );

  const canAddBazaar = profile.role === "super_admin" || profile.can_add_bazaar;
  const canAddMeals = profile.role === "super_admin" || profile.can_add_meals;

  const { data: myPendingRequests } = canAddMeals
    ? { data: null }
    : await supabase
        .from("meal_requests")
        .select("id, request_date, lunch, dinner")
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .order("request_date");

  const { data: myPendingCostRequests } = canAddBazaar
    ? { data: null }
    : await supabase
        .from("meal_cost_requests")
        .select("id, entry_date, amount, description")
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .order("entry_date");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Meal Ledger - {monthKey}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bazaar spending, deposits and daily meals. Fully transparent to every member, and
          entirely separate from the Utility ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">Total bazaar</CardDescription>
            <CardTitle className="text-2xl font-semibold">{totalBazaar.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">Total meals</CardDescription>
            <CardTitle className="text-2xl font-semibold">{totalMeals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardDescription className="text-xs font-medium tracking-wide uppercase">Meal rate</CardDescription>
            <CardTitle className="text-2xl font-semibold">{mealRate.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-1 text-xs text-muted-foreground">
            Total bazaar ÷ total meals
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div id="bazaar-form" className="scroll-mt-20">
          {canAddBazaar ? (
            <BazaarForm members={members ?? []} defaultDate={defaultDate} />
          ) : (
            <Card className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Your meal cost requests</p>
                <p className="text-xs text-muted-foreground">
                  Use &quot;Request Meal Cost&quot; in the Meal menu - once approved, the amount is
                  credited to your meal deposit.
                </p>
              </div>
              {myPendingCostRequests?.length ? (
                <div className="flex flex-col gap-1.5">
                  {myPendingCostRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground"
                    >
                      <span>
                        {formatDate(r.entry_date)} - {r.amount.toFixed(2)} tk (pending)
                      </span>
                      <CancelMealCostRequestButton requestId={r.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No pending requests.</p>
              )}
            </Card>
          )}
        </div>
        <div id="daily-meal-form" className="scroll-mt-20">
          {canAddMeals ? (
            <DailyMealForm members={members ?? []} defaultDate={defaultDate} />
          ) : (
            <Card className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Your meal requests</p>
                <p className="text-xs text-muted-foreground">
                  Use &quot;Request Meal&quot; in the Meal menu to ask for a meal on a date - a manager will
                  review it.
                </p>
              </div>
              {myPendingRequests?.length ? (
                <div className="flex flex-col gap-1.5">
                  {myPendingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground"
                    >
                      <span>
                        {formatDate(r.request_date)} - {r.lunch + r.dinner} meal
                        {r.lunch + r.dinner === 1 ? "" : "s"} (pending)
                      </span>
                      <CancelMealRequestButton requestId={r.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No pending requests.</p>
              )}
            </Card>
          )}
        </div>
        {profile.role === "super_admin" && (
          <div id="deposit-form" className="scroll-mt-20">
            <DepositForm members={members ?? []} defaultDate={defaultDate} />
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Monthly statement - {monthKey}</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Meals</TableHead>
                <TableHead className="text-right">Meal cost</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="flex items-center gap-1.5 text-foreground">
                    {getDisplayName(r)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.meals}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{r.deposit.toFixed(2)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      r.balance < 0 ? "text-destructive" : "text-emerald-600"
                    )}
                  >
                    {r.balance.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    No members to show yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
