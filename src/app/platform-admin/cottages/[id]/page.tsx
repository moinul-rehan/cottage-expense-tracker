import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFullName } from "@/lib/data/display-name";
import { formatDate } from "@/lib/format-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "../../AdminShell";
import { AdminCard, AdminCardTitle, AdminBadge } from "../../AdminUI";
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
    <AdminShell title={cottage.name} breadcrumb={cottage.name}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{cottage.name}</h2>
          {pendingApproval && <AdminBadge tone="warning">Pending approval</AdminBadge>}
          {rejected && <AdminBadge tone="critical">Rejected</AdminBadge>}
          {suspended && <AdminBadge tone="critical">Suspended</AdminBadge>}
          <span className="text-sm text-black/40 dark:text-white/40">Created {formatDate(cottage.created_at)}</span>
        </div>

        {pendingApproval && <ApprovalControls cottageId={cottage.id} />}
        {rejected && cottage.rejected_reason && (
          <AdminCard className="border-red-500/30">
            <AdminCardTitle className="mb-2 text-red-600 dark:text-red-400">Rejection reason</AdminCardTitle>
            <p className="text-sm text-black/60 dark:text-white/60">{cottage.rejected_reason}</p>
          </AdminCard>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PlanAndStatusControls cottageId={cottage.id} plan={cottage.plan} subscriptionStatus={cottage.subscription_status} />

          <AdminCard className="flex flex-col gap-3">
            <AdminCardTitle>Access</AdminCardTitle>
            {suspended && cottage.suspended_reason && (
              <p className="text-sm text-black/60 dark:text-white/60">Reason: {cottage.suspended_reason}</p>
            )}
            <SuspendControls cottageId={cottage.id} suspended={suspended} />
          </AdminCard>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Members ({members?.length ?? 0})</h3>
          <AdminCard className="p-0">
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
                    <TableCell className="font-medium">{getFullName(m)}</TableCell>
                    <TableCell className="text-black/40 dark:text-white/40">{m.email ?? "-"}</TableCell>
                    <TableCell>
                      <AdminBadge tone={m.role === "super_admin" ? "good" : "neutral"}>
                        {m.role === "super_admin" ? "Super Admin" : "Member"}
                      </AdminBadge>
                    </TableCell>
                    <TableCell>
                      <AdminBadge tone={m.is_active ? "good" : "neutral"}>{m.is_active ? "Active" : "Inactive"}</AdminBadge>
                    </TableCell>
                  </TableRow>
                ))}
                {!members?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-black/40 dark:text-white/40">
                      No members yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AdminCard>
        </div>

        <AdminCard className="border-red-500/30">
          <AdminCardTitle className="mb-3 text-red-600 dark:text-red-400">Danger zone</AdminCardTitle>
          <DeleteCottageForm cottageId={cottage.id} cottageName={cottage.name} />
        </AdminCard>
      </div>
    </AdminShell>
  );
}
