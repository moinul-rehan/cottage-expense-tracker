"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setAutoApproveCottages(enabled: boolean) {
  const owner = await requirePlatformOwner();
  const admin = createAdminClient();
  await admin
    .from("platform_settings")
    .update({ auto_approve_cottages: enabled, updated_at: new Date().toISOString(), updated_by: owner.id })
    .eq("id", true);
  revalidatePath("/platform-admin/settings");
}
