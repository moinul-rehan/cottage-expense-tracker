import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { AddExpenseForm } from "./AddExpenseForm";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const CATEGORIES = ["servant", "electricity", "internet", "other"] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: members }, expensesQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name"),
    (async () => {
      let query = supabase
        .from("expenses")
        .select(
          "id, category, amount, description, expense_date, split_type, payer:paid_by(first_name, last_name)"
        )
        .order("expense_date", { ascending: false })
        .limit(50);
      if (category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
        query = query.eq("category", category);
      }
      return query;
    })(),
  ]);

  const expenses = expensesQuery.data ?? [];
  const canAddExpenses = profile.role === "super_admin" || profile.can_add_expenses;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Servant, electricity, internet, and other shared costs.
        </p>
      </div>

      {canAddExpenses ? (
        <AddExpenseForm members={members ?? []} />
      ) : (
        <Card className="p-4 text-sm text-muted-foreground">
          You don&apos;t have permission to add expenses — ask your admin.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1 text-sm">
          <Link
            href="/expenses"
            className={cn(
              "rounded-md px-2.5 py-1",
              !category ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/expenses?category=${c}`}
              className={cn(
                "rounded-md px-2.5 py-1 capitalize",
                category === c ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c}
            </Link>
          ))}
        </div>

        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead>Split</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => {
                const payer = e.payer as unknown as { first_name: string; last_name: string | null } | null;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{e.expense_date}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{e.category}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payer ? getDisplayName(payer) : "—"}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{e.split_type}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(e.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!expenses.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    No expenses yet.
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
