import { createHash } from "crypto";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { RELEASES_BUCKET, type ReleaseChannel } from "@/lib/data/releases";

// Route Handlers reading raw FormData via request.formData() aren't subject
// to the same restrictive default body-size limit Server Actions have, but
// we still enforce our own ceiling below so a bad upload fails fast with a
// clear message instead of an opaque platform error.
const MAX_FILE_BYTES = 200 * 1024 * 1024;
const VALID_CHANNELS: ReleaseChannel[] = ["stable", "beta", "alpha"];

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  const user = await requirePlatformAdmin();
  const admin = createAdminClient();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Could not read the upload.", 400);
  }

  const file = formData.get("file");
  const version = String(formData.get("version") ?? "").trim();
  const channelInput = String(formData.get("channel") ?? "stable").trim();
  const releaseNotes = String(formData.get("release_notes") ?? "").trim();
  const minSupportedVersion = String(formData.get("min_supported_version") ?? "").trim();
  const releaseId = String(formData.get("release_id") ?? "").trim();

  if (!(file instanceof File) || !file.size) {
    return jsonError("Choose an APK file to upload.", 400);
  }
  if (!file.name.toLowerCase().endsWith(".apk")) {
    return jsonError("File must be a .apk package.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return jsonError("File is too large - the limit is 200MB.", 413);
  }
  const channel: ReleaseChannel = VALID_CHANNELS.includes(channelInput as ReleaseChannel)
    ? (channelInput as ReleaseChannel)
    : "stable";

  // "Replace" path: overwrite the file on an existing release row instead of
  // creating a new one.
  if (releaseId) {
    const { data: existing } = await admin.from("app_releases").select("*").eq("id", releaseId).maybeSingle();
    if (!existing) return jsonError("Release not found.", 404);

    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");

    const { error: uploadError } = await admin.storage
      .from(RELEASES_BUCKET)
      .upload(existing.storage_path, bytes, { contentType: "application/vnd.android.package-archive", upsert: true });
    if (uploadError) return jsonError("Failed to upload the file.", 500);

    const { data: updated, error: updateError } = await admin
      .from("app_releases")
      .update({
        file_size: bytes.byteLength,
        sha256,
        release_notes: releaseNotes || existing.release_notes,
        min_supported_version: minSupportedVersion || existing.min_supported_version,
      })
      .eq("id", releaseId)
      .select("*")
      .single();
    if (updateError || !updated) return jsonError("Failed to update the release.", 500);

    return new Response(JSON.stringify(updated), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (!version) {
    return jsonError("Version is required.", 400);
  }

  const { data: existingVersion } = await admin
    .from("app_releases")
    .select("id")
    .eq("platform", "android")
    .eq("version", version)
    .maybeSingle();
  if (existingVersion) {
    return jsonError(`Version ${version} already exists.`, 409);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const storagePath = `android/${version}/cottage-${version}.apk`;

  const { error: uploadError } = await admin.storage
    .from(RELEASES_BUCKET)
    .upload(storagePath, bytes, { contentType: "application/vnd.android.package-archive", upsert: true });
  if (uploadError) return jsonError("Failed to upload the file.", 500);

  const { data: inserted, error: insertError } = await admin
    .from("app_releases")
    .insert({
      platform: "android",
      version,
      channel,
      storage_path: storagePath,
      file_size: bytes.byteLength,
      sha256,
      release_notes: releaseNotes || null,
      min_supported_version: minSupportedVersion || null,
      uploaded_by: user.id,
      is_published: false,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    // Roll back the uploaded object so a failed insert doesn't leave orphaned storage.
    await admin.storage.from(RELEASES_BUCKET).remove([storagePath]);
    return jsonError("Failed to save the release record.", 500);
  }

  return new Response(JSON.stringify(inserted), { status: 200, headers: { "Content-Type": "application/json" } });
}
