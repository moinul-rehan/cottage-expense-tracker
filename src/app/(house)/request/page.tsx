import { redirect } from "next/navigation";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MealRequestActions } from "./MealRequestActions";

const STATUS_VARIANT = {
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
} as const;

export default async function RequestPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_meals) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [{ data: members }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true),
    supabase
      .from("meal_requests")
      .select("id, user_id, request_date, lunch, dinner, status, created_at, reviewed_at")
      .order("created_at", { ascending: false }),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));
  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const history = (requests ?? []).filter((r) => r.status !== "pending").slice(0, 30);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meal requests submitted by members without direct meal-logging access. Approving writes
          straight into their meal history for that date.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Pending ({pending.length})</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Lunch</TableHead>
                <TableHead className="text-right">Dinner</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((r) => {
                const member = membersById.get(r.user_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-foreground">{member ? getDisplayName(member) : "—"}</TableCell>
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

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">History</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Lunch</TableHead>
                <TableHead className="text-right">Dinner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((r) => {
                const member = membersById.get(r.user_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-foreground">{member ? getDisplayName(member) : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(r.request_date)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.lunch}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.dinner}</TableCell>
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
