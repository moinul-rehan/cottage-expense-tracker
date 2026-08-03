import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { SendNotificationForm } from "./SendNotificationForm";

export default async function PlatformAdminNotificationsPage() {
  await requirePlatformAdmin();

  const admin = createAdminClient();
  const [{ data: cottages }, { data: members }] = await Promise.all([
    admin.from("cottages").select("id, name").order("name"),
    admin
      .from("profiles")
      .select("id, first_name, last_name, cottage_id")
      .eq("is_active", true)
      .order("first_name"),
  ]);

  return (
    <AdminShell title="Notifications">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Send a notification</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">
            Push + in-app notification to a single member, every member of one Cottage, or everyone.
          </p>
        </div>

        <SendNotificationForm cottages={cottages ?? []} members={members ?? []} />
      </div>
    </AdminShell>
  );
}
