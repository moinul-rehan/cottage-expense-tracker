import Link from "next/link";
import { getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKey } from "@/lib/data/finance";
import {
  recentMealMonthKeys,
  getDailyMealRecords,
  getDepositRecords,
  getBazaarRecords,
} from "@/lib/data/meal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "meal", label: "Meal Details" },
  { value: "deposit", label: "Deposit" },
  { value: "cost", label: "Meal Cost" },
] as const;

type ViewValue = (typeof VIEWS)[number]["value"];

function MemberCell({ member }: { member: { first_name: string; last_name: string | null; avatar_url: string | null } | null }) {
  if (!member) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarImage src={member.avatar_url ?? undefined} alt={getDisplayName(member)} />
        <AvatarFallback>{member.first_name[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      {getDisplayName(member)}
    </span>
  );
}

export default async function MealMonthDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const { month, view } = await searchParams;
  const supabase = await createClient();

  const recentMonths = recentMealMonthKeys();
  const monthKey = month && recentMonths.includes(month) ? month : recentMonths[0];
  const activeView: ViewValue = VIEWS.some((v) => v.value === view) ? (view as ViewValue) : "meal";

  const [mealRecords, depositRecords, bazaarRecords] = await Promise.all([
    activeView === "meal" ? getDailyMealRecords(supabase, monthKey) : Promise.resolve([]),
    activeView === "deposit" ? getDepositRecords(supabase, monthKey) : Promise.resolve([]),
    activeView === "cost" ? getBazaarRecords(supabase, monthKey) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Month Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full meal, deposit and cost records for every member, month by month.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 text-sm">
        {recentMonths.map((m) => (
          <Link
            key={m}
            href={`/meal/month-details?month=${m}&view=${activeView}`}
            className={cn(
              "rounded-md px-2.5 py-1",
              m === monthKey ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === currentMonthKey() ? `${m} (current)` : m}
          </Link>
        ))}
      </div>

      <div className="inline-flex w-fit gap-1 rounded-lg border p-1">
        {VIEWS.map((v) => (
          <Link
            key={v.value}
            href={`/meal/month-details?month=${monthKey}&view=${v.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              activeView === v.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {activeView === "meal" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Meal count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mealRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{r.meal_date}</TableCell>
                  <TableCell className="text-foreground">
                    <MemberCell member={r.member} />
                  </TableCell>
                  <TableCell className="text-right font-medium">{r.count}</TableCell>
                </TableRow>
              ))}
              {!mealRecords.length && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                    No meal entries for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeView === "deposit" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depositRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{r.deposit_date}</TableCell>
                  <TableCell className="text-foreground">
                    <MemberCell member={r.member} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.note ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{Number(r.amount).toFixed(2)} tk</TableCell>
                </TableRow>
              ))}
              {!depositRecords.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No deposits for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {activeView === "cost" && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Spent by</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bazaarRecords.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">{r.entry_date}</TableCell>
                  <TableCell className="text-foreground">
                    <MemberCell member={r.member} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.description ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{Number(r.amount).toFixed(2)} tk</TableCell>
                </TableRow>
              ))}
              {!bazaarRecords.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No bazaar entries for {monthKey} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
