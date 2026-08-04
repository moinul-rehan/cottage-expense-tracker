import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRelease, RELEASES_BUCKET } from "@/lib/data/releases";

/** Admin-only fetch of one specific (possibly archived/unpublished) release's
 * bytes, distinct from the public /download/latest route which only ever
 * serves the currently-published release and records analytics. This route
 * intentionally does not call recordDownload - it's an admin re-download,
 * not a real end-user install. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;

  const admin = createAdminClient();
  const release = await getRelease(admin, id);
  if (!release) {
    return new Response(JSON.stringify({ error: "Release not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: blob, error } = await admin.storage.from(RELEASES_BUCKET).download(release.storage_path);
  if (error || !blob) {
    return new Response(JSON.stringify({ error: "Failed to retrieve release file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buffer = await blob.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="cottage-${release.version}.apk"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
