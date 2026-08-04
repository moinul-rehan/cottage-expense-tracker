"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { promises as fs } from "fs";
import path from "path";

export type ActionResponse = { error?: string; success?: string } | void;

export async function uploadAndPublishRelease(
  _prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requirePlatformAdmin();
  const admin = createAdminClient();

  const file = formData.get("apk_file") as File | null;
  const version = String(formData.get("version") ?? "").trim();
  const channel = (String(formData.get("channel") ?? "beta").trim().toLowerCase()) as "stable" | "beta" | "alpha";
  const releaseNotes = String(formData.get("release_notes") ?? "").trim();
  const minSupportedVersion = String(formData.get("min_supported_version") ?? "").trim() || null;
  const shouldPublish = String(formData.get("should_publish") ?? "true") === "true";

  if (!file || file.size === 0) {
    return { error: "Please select an APK file to upload." };
  }

  if (!file.name.toLowerCase().endsWith(".apk")) {
    return { error: "Invalid file format. File must have a .apk extension." };
  }

  if (!version || !/^\d+\.\d+\.\d+(-\w+)?$/.test(version)) {
    return { error: "Invalid version number. Format must be semantic (e.g., 1.0.4 or 1.0.4-beta)." };
  }

  // Check if version already exists
  const { data: existing } = await admin
    .from("app_releases")
    .select("id")
    .eq("platform", "android")
    .eq("version", version)
    .maybeSingle();

  if (existing) {
    return { error: `Version ${version} already exists. Please increment the version number.` };
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileSize = buffer.length;

  // Store file locally in public/releases or Supabase storage
  const filename = `Cottage-v${version}.apk`;
  const uploadDir = path.join(process.cwd(), "public", "releases");
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  const relativePath = `/releases/${filename}`;

  // Get user profile ID if available
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  const status = shouldPublish ? "active" : "draft";

  const { error: dbError } = await admin.from("app_releases").insert({
    platform: "android",
    version,
    channel,
    file_path: relativePath,
    file_size_bytes: fileSize,
    release_notes: releaseNotes || null,
    min_supported_version: minSupportedVersion,
    status,
    uploaded_by: profile?.id ?? null,
    published_at: shouldPublish ? new Date().toISOString() : null,
  });

  if (dbError) {
    return { error: `Database error: ${dbError.message}` };
  }

  revalidatePath("/platform-admin/releases");
  revalidatePath("/download");
  return { success: `Successfully ${shouldPublish ? "published" : "uploaded"} release v${version}!` };
}

export async function updateReleaseStatus(releaseId: string, status: "active" | "archived" | "draft") {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const updateData: { status: string; published_at?: string } = { status };
  if (status === "active") {
    updateData.published_at = new Date().toISOString();
  }

  await admin.from("app_releases").update(updateData).eq("id", releaseId);

  revalidatePath("/platform-admin/releases");
  revalidatePath("/download");
}

export async function deleteRelease(releaseId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: release } = await admin
    .from("app_releases")
    .select("file_path")
    .eq("id", releaseId)
    .maybeSingle();

  if (release?.file_path) {
    try {
      const fullPath = path.join(process.cwd(), "public", release.file_path);
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist on disk
    }
  }

  await admin.from("app_releases").delete().eq("id", releaseId);

  revalidatePath("/platform-admin/releases");
  revalidatePath("/download");
}
