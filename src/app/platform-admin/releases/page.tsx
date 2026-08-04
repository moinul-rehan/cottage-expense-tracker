import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { ReleaseManagementUI, type ReleaseRow, type AnalyticsSummary } from "./ReleaseManagementUI";

export default async function AdminReleasesPage() {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const [{ data: releases }, { data: logs }] = await Promise.all([
    admin.from("app_releases").select("*").order("created_at", { ascending: false }),
    admin.from("app_download_logs").select("created_at"),
  ]);

  const allReleases: ReleaseRow[] = (releases ?? []).map((r) => ({
    id: r.id,
    platform: r.platform,
    version: r.version,
    channel: r.channel,
    file_path: r.file_path,
    file_size_bytes: Number(r.file_size_bytes || 0),
    release_notes: r.release_notes,
    min_supported_version: r.min_supported_version,
    status: r.status,
    download_count: r.download_count ?? 0,
    created_at: r.created_at,
    published_at: r.published_at,
  }));

  const activeRelease = allReleases.find((r) => r.status === "active") || allReleases[0];

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let downloadsToday = 0;
  let downloadsThisMonth = 0;

  for (const log of logs ?? []) {
    const time = new Date(log.created_at).getTime();
    if (time >= startOfDay) downloadsToday++;
    if (time >= startOfMonth) downloadsThisMonth++;
  }

  const totalDownloads = allReleases.reduce((sum, r) => sum + r.download_count, 0);

  const analytics: AnalyticsSummary = {
    activeVersion: activeRelease ? `v${activeRelease.version}` : "None",
    latestReleaseDate: activeRelease?.published_at || activeRelease?.created_at || null,
    latestChannel: activeRelease?.channel || "N/A",
    latestSizeMb: activeRelease ? (activeRelease.file_size_bytes / (1024 * 1024)).toFixed(1) + " MB" : "0 MB",
    totalDownloads,
    downloadsToday,
    downloadsThisMonth,
  };

  return (
    <AdminShell title="App Releases">
      <ReleaseManagementUI releases={allReleases} analytics={analytics} />
    </AdminShell>
  );
}
