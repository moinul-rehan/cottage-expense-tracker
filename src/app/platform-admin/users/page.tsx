import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFullName } from "@/lib/data/display-name";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlatformAdminNav } from "../PlatformAdminNav";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <PlatformAdminNav />

      <div>
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search for a member across every Cottage.</p>
      </div>

      <form className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Search by name or email…" className="max-w-sm" />
        <Button type="submit">Search</Button>
      </form>

      <Card className="p-0">
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
                <TableCell className="font-medium text-foreground">{getFullName(u)}</TableCell>
                <TableCell className="text-muted-foreground">{u.email ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{cottageNameById.get(u.cottage_id) ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "super_admin" ? "default" : "secondary"} className="capitalize">
                    {u.role === "super_admin" ? "Super Admin" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!users?.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  {query ? "No matching users." : "No users yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
