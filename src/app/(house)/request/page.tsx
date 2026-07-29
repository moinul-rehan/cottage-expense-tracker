import { redirect } from "next/navigation";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MealRequestActions } from "./MealRequestActions";
import { MealCostRequestActions } from "./MealCostRequestActions";

const STATUS_VARIANT = {
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
} as const;

type HistoryRow = {
  id: string;
  type: "meal" | "meal_cost";
  user_id: string;
  date: string;
  details: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

export default async function RequestPage() {
  const profile = await getCurrentProfile();
  const canAddMeals = profile.role === "super_admin" || profile.can_add_meals;
  const canAddBazaar = profile.role === "super_admin" || profile.can_add_bazaar;
  if (!canAddMeals && !canAddBazaar) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [{ data: members }, mealRequests, mealCostRequests] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true),
    canAddMeals
      ? supabase
          .from("meal_requests")
          .select("id, user_id, request_date, lunch, dinner, status, created_at, reviewed_at")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    canAddBazaar
      ? supabase
          .from("meal_cost_requests")
          .select("id, user_id, entry_date, amount, description, status, created_at, reviewed_at")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));
  const pending = (mealRequests.data ?? []).filter((r) => r.status === "pending");
  const costPending = (mealCostRequests.data ?? []).filter((r) => r.status === "pending");

  const mealHistory: HistoryRow[] = (mealRequests.data ?? [])
    .filter((r) => r.status !== "pending")
    .map((r) => ({
      id: r.id,
      type: "meal",
      user_id: r.user_id,
      date: r.request_date,
      details: `${r.lunch} lunch, ${r.dinner} dinner`,
      status: r.status,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
    }));
  const costHistory: HistoryRow[] = (mealCostRequests.data ?? [])
    .filter((r) => r.status !== "pending")
    .map((r) => ({
      id: r.id,
      type: "meal_cost",
      user_id: r.user_id,
      date: r.entry_date,
      details: `${r.amount.toFixed(2)} tk${r.description ? ` — ${r.description}` : ""}`,
      status: r.status,
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
    }));
  const history = [...mealHistory, ...costHistory]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meal and meal cost requests submitted by members without direct logging access.
          Approving writes straight into their meal history / deposit.
        </p>
      </div>

      {canAddMeals && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Meal Request — Pending ({pending.length})</h2>
          <Card className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Member</TableHead>
                  <TableHead className="w-[16%]">Date</TableHead>
                  <TableHead className="w-[10%] text-right">Lunch</TableHead>
                  <TableHead className="w-[10%] text-right">Dinner</TableHead>
                  <TableHead className="w-[20%]">Submitted</TableHead>
                  <TableHead className="w-[24%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => {
                  const member = membersById.get(r.user_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="truncate text-foreground">{member ? getDisplayName(member) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.request_date)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.lunch}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.dinner}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell>
                        <MealRequestActions requestId={r.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!pending.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No pending requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {canAddBazaar && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Meal Cost Request — Pending ({costPending.length})</h2>
          <Card className="p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Member</TableHead>
                  <TableHead className="w-[14%]">Date</TableHead>
                  <TableHead className="w-[12%] text-right">Amount</TableHead>
                  <TableHead className="w-[22%]">Description</TableHead>
                  <TableHead className="w-[14%]">Submitted</TableHead>
                  <TableHead className="w-[20%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {costPending.map((r) => {
                  const member = membersById.get(r.user_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="truncate text-foreground">{member ? getDisplayName(member) : "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.entry_date)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.amount.toFixed(2)}</TableCell>
                      <TableCell className="truncate text-muted-foreground">{r.description ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(r.created_at)}</TableCell>
                      <TableCell>
                        <MealCostRequestActions requestId={r.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!costPending.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No pending requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">History</h2>
        <Card className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Member</TableHead>
                <TableHead className="w-[12%]">Type</TableHead>
                <TableHead className="w-[14%]">Date</TableHead>
                <TableHead className="w-[26%]">Details</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[20%]">Reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((r) => {
                const member = membersById.get(r.user_id);
                return (
                  <TableRow key={`${r.type}-${r.id}`}>
                    <TableCell className="truncate text-foreground">{member ? getDisplayName(member) : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.type === "meal" ? "Meal" : "Meal Cost"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(r.date)}</TableCell>
                    <TableCell className="truncate text-muted-foreground">{r.details}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status as keyof typeof STATUS_VARIANT] ?? "secondary"} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reviewed_at ? formatDateTime(r.reviewed_at) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!history.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    No reviewed requests yet.
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
