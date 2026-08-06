import { requirePlatformOwner } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { AutoApproveToggle } from "./AutoApproveToggle";

export default async function PlatformAdminSettingsPage() {
  await requirePlatformOwner();

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("platform_settings")
    .select("auto_approve_cottages")
    .eq("id", true)
    .maybeSingle();

  return (
    <AdminShell title="Settings">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">Platform-wide behavior, owner-only.</p>
        </div>

        <AutoApproveToggle initialEnabled={settings?.auto_approve_cottages ?? false} />
      </div>
    </AdminShell>
  );
}
