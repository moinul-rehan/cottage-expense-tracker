import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { promises as fs } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") || "android";
  const userAgent = request.headers.get("user-agent") || "";

  const admin = createAdminClient();

  // Find latest active release
  const { data: release } = await admin
    .from("app_releases")
    .select("*")
    .eq("platform", platform)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!release) {
    // If no active release found, redirect back to download page with error flag
    return NextResponse.redirect(new URL("/download?error=no_active_release", request.url));
  }

  // Increment download stats asynchronously
  try {
    await admin.rpc("record_app_download", {
      p_release_id: release.id,
      p_user_agent: userAgent,
    });
  } catch {
    // Fallback direct update if RPC is not available
    await admin
      .from("app_releases")
      .update({ download_count: (release.download_count || 0) + 1 })
      .eq("id", release.id);

    await admin.from("app_download_logs").insert({
      release_id: release.id,
      platform: release.platform,
      user_agent: userAgent,
    });
  }

  // If stored locally in public/releases
  if (release.file_path.startsWith("/releases/")) {
    const relativeFilePath = release.file_path.replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", relativeFilePath);

    try {
      const fileBuffer = await fs.readFile(fullPath);
      const filename = `Cottage-v${release.version}.apk`;

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(fileBuffer.length),
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    } catch {
      // Fallback redirect if file is missing locally
      return NextResponse.redirect(new URL(release.file_path, request.url));
    }
  }

  // External URL or Supabase storage URL redirect
  return NextResponse.redirect(release.file_path);
}
