import { requirePlatformOwner } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "../AdminShell";
import { AdminCard } from "../AdminUI";
import { InviteModeratorForm } from "./InviteModeratorForm";
import { RemoveModeratorButton } from "./RemoveModeratorButton";

export default async function PlatformAdminModeratorsPage() {
  await requirePlatformOwner();

  const admin = createAdminClient();
  const { data: moderators } = await admin
    .from("platform_moderators")
    .select("id, email, created_at, invited_by")
    .order("created_at", { ascending: false });

  const inviterIds = Array.from(new Set((moderators ?? []).map((m) => m.invited_by).filter(Boolean))) as string[];
  const invitersById = new Map<string, string>();
  if (inviterIds.length) {
    const { data: inviters } = await admin.auth.admin.listUsers();
    for (const u of inviters.users) {
      if (inviterIds.includes(u.id)) invitersById.set(u.id, u.email ?? u.id);
    }
  }

  return (
    <AdminShell title="Moderators">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Moderators</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">
            Moderators get the same access as you across every Cottage, member, notification and feedback item -
            except managing moderators, which stays owner-only.
          </p>
        </div>

        <InviteModeratorForm />

        <AdminCard className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Invited by</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(moderators ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.email}</TableCell>
                  <TableCell className="text-black/40 dark:text-white/40">
                    {(m.invited_by && invitersById.get(m.invited_by)) ?? "-"}
                  </TableCell>
                  <TableCell className="text-black/40 dark:text-white/40">{formatDateTime(m.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <RemoveModeratorButton id={m.id} email={m.email} />
                  </TableCell>
                </TableRow>
              ))}
              {!moderators?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-black/40 dark:text-white/40">
                    No moderators yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
