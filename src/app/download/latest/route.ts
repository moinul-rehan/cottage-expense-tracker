import { createAdminClient } from "@/lib/supabase/admin";
import { getLatestPublishedRelease, recordDownload, RELEASES_BUCKET, type ReleasePlatform } from "@/lib/data/releases";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = (searchParams.get("platform") ?? "android") as ReleasePlatform;

  const supabase = createAdminClient();
  const release = await getLatestPublishedRelease(supabase, platform);

  if (!release) {
    return new Response(JSON.stringify({ error: "No published release available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: blob, error } = await supabase.storage.from(RELEASES_BUCKET).download(release.storage_path);

  if (error || !blob) {
    return new Response(JSON.stringify({ error: "Failed to retrieve release file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fire-and-forget - don't block the response on this finishing.
  void recordDownload(supabase, release.id);

  const buffer = await blob.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="cottage-${release.version}.apk"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
