"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { RELEASES_BUCKET, type ReleasePlatform } from "@/lib/data/releases";

/** Publishes a release: archives whatever was previously active for the
 * platform first, then publishes the new one - two sequential awaited
 * updates so the app_releases_one_active_per_platform partial unique index
 * never sees two active rows at once. */
export async function publishRelease(releaseId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: release } = await admin.from("app_releases").select("platform").eq("id", releaseId).maybeSingle();
  if (!release) return;

  const platform = release.platform as ReleasePlatform;

  const { data: currentlyActive } = await admin
    .from("app_releases")
    .select("id")
    .eq("platform", platform)
    .eq("is_published", true)
    .is("archived_at", null)
    .neq("id", releaseId)
    .maybeSingle();

  if (currentlyActive) {
    await admin
      .from("app_releases")
      .update({ is_published: false, archived_at: new Date().toISOString() })
      .eq("id", currentlyActive.id);
  }

  await admin.from("app_releases").update({ is_published: true, archived_at: null }).eq("id", releaseId);

  revalidatePath("/platform-admin/releases");
  revalidatePath("/download");
}

export async function archiveRelease(releaseId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  await admin
    .from("app_releases")
    .update({ is_published: false, archived_at: new Date().toISOString() })
    .eq("id", releaseId);

  revalidatePath("/platform-admin/releases");
  revalidatePath("/download");
}

export type DeleteReleaseState = { error?: string } | undefined;

export async function deleteRelease(
  _prevState: DeleteReleaseState,
  formData: FormData
): Promise<DeleteReleaseState> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const releaseId = String(formData.get("release_id") ?? "");
  const confirmVersion = String(formData.get("confirm_version") ?? "").trim();

  const { data: release } = await admin.from("app_releases").select("version, storage_path").eq("id", releaseId).maybeSingle();
  if (!release) return { error: "Release not found." };
  if (confirmVersion !== release.version) return { error: "Version doesn't match -- type it exactly as shown." };

  await admin.storage.from(RELEASES_BUCKET).remove([release.storage_path]);
  const { error } = await admin.from("app_releases").delete().eq("id", releaseId);
  if (error) return { error: "Could not delete the release." };

  revalidatePath("/platform-admin/releases");
  revalidatePath("/download");
  return undefined;
}
