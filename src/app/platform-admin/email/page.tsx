import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { AdminEmailComposer, type AdminUserOption } from "./AdminEmailComposer";

export default async function AdminEmailPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: cottages }] = await Promise.all([
    admin.from("profiles").select("id, first_name, last_name, email, cottage_id, role"),
    admin.from("cottages").select("id, name, status"),
  ]);

  const cottageMap = new Map<string, { name: string; status: string }>();
  for (const c of cottages ?? []) {
    cottageMap.set(c.id, { name: c.name, status: c.status });
  }

  const users: AdminUserOption[] = (profiles ?? [])
    .filter((p) => Boolean(p.email))
    .map((p) => {
      const cottageInfo = cottageMap.get(p.cottage_id);
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "User";
      return {
        id: p.id,
        name,
        email: p.email!,
        cottageName: cottageInfo?.name ?? "",
        status: cottageInfo?.status ?? "approved",
      };
    });

  return (
    <AdminShell title="Send Email">
      <AdminEmailComposer users={users} />
    </AdminShell>
  );
}
