import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFullName } from "@/lib/data/display-name";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlatformAdminNav } from "../../PlatformAdminNav";
import { ApprovalControls, PlanAndStatusControls, SuspendControls, DeleteCottageForm } from "./CottageAdminControls";

export default async function PlatformAdminCottageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const [{ data: cottage }, { data: members }] = await Promise.all([
    admin
      .from("cottages")
      .select("id, name, plan, subscription_status, suspended_at, suspended_reason, status, rejected_reason, created_at")
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, first_name, last_name, email, role, is_active")
      .eq("cottage_id", id)
      .order("created_at"),
  ]);

  if (!cottage) notFound();

  const suspended = !!cottage.suspended_at;
  const pendingApproval = cottage.status === "pending";
  const rejected = cottage.status === "rejected";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <PlatformAdminNav />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">{cottage.name}</h1>
        {pendingApproval && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Pending approval
          </Badge>
        )}
        {rejected && <Badge variant="destructive">Rejected</Badge>}
        {suspended && <Badge variant="destructive">Suspended</Badge>}
        <span className="text-sm text-muted-foreground">Created {formatDate(cottage.created_at)}</span>
      </div>

      {pendingApproval && <ApprovalControls cottageId={cottage.id} />}
      {rejected && cottage.rejected_reason && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm">Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{cottage.rejected_reason}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanAndStatusControls cottageId={cottage.id} plan={cottage.plan} subscriptionStatus={cottage.subscription_status} />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {suspended && cottage.suspended_reason && (
              <p className="text-sm text-muted-foreground">Reason: {cottage.suspended_reason}</p>
            )}
            <SuspendControls cottageId={cottage.id} suspended={suspended} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Members ({members?.length ?? 0})</h2>
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(members ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-foreground">{getFullName(m)}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "super_admin" ? "default" : "secondary"} className="capitalize">
                      {m.role === "super_admin" ? "Super Admin" : "Member"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.is_active ? "default" : "secondary"}>{m.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!members?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    No members yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteCottageForm cottageId={cottage.id} cottageName={cottage.name} />
        </CardContent>
      </Card>
    </div>
  );
}
