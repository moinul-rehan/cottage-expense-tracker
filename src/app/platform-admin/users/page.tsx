import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFullName } from "@/lib/data/display-name";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "../AdminShell";
import { AdminCard, AdminInput, AdminButton, AdminBadge } from "../AdminUI";

export default async function PlatformAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePlatformAdmin();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const admin = createAdminClient();
  let usersQuery = admin
    .from("profiles")
    .select("id, first_name, last_name, email, role, is_active, cottage_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (query) {
    usersQuery = usersQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const [{ data: users }, { data: cottages }] = await Promise.all([
    usersQuery,
    admin.from("cottages").select("id, name"),
  ]);
  const cottageNameById = new Map((cottages ?? []).map((c) => [c.id, c.name]));

  return (
    <AdminShell title="Users">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">Search for a member across every Cottage.</p>
        </div>

        <form className="flex gap-2">
          <AdminInput name="q" defaultValue={query} placeholder="Search by name or email…" className="max-w-sm" />
          <AdminButton type="submit">Search</AdminButton>
        </form>

        <AdminCard className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cottage</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{getFullName(u)}</TableCell>
                  <TableCell className="text-black/40 dark:text-white/40">{u.email ?? "-"}</TableCell>
                  <TableCell className="text-black/40 dark:text-white/40">
                    {cottageNameById.get(u.cottage_id) ?? "-"}
                  </TableCell>
                  <TableCell>
                    <AdminBadge tone={u.role === "super_admin" ? "good" : "neutral"}>
                      {u.role === "super_admin" ? "Super Admin" : "Member"}
                    </AdminBadge>
                  </TableCell>
                  <TableCell>
                    <AdminBadge tone={u.is_active ? "good" : "neutral"}>{u.is_active ? "Active" : "Inactive"}</AdminBadge>
                  </TableCell>
                </TableRow>
              ))}
              {!users?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-black/40 dark:text-white/40">
                    {query ? "No matching users." : "No users yet."}
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
