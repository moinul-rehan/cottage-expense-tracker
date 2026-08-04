import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getLatestPublishedRelease,
  getDownloadAnalytics,
  getDownloadTrend,
  listReleases,
  formatFileSize,
} from "@/lib/data/releases";
import { AdminShell } from "../AdminShell";
import { AdminCard, AdminCardTitle, AdminBadge } from "../AdminUI";
import { StatTile, TrendBarChart } from "../AdminCharts";
import { UploadReleaseForm } from "./UploadReleaseForm";
import { ReleaseRowActions } from "./ReleaseRowActions";

export default async function PlatformAdminReleasesPage() {
  await requirePlatformAdmin();

  const admin = createAdminClient();
  const [latest, analytics, trend, releases] = await Promise.all([
    getLatestPublishedRelease(admin, "android"),
    getDownloadAnalytics(admin, "android"),
    getDownloadTrend(admin, "android", 14),
    listReleases(admin, "android"),
  ]);

  const uploaderIds = Array.from(new Set(releases.map((r) => r.uploaded_by).filter(Boolean))) as string[];
  const emailById = new Map<string, string>();
  if (uploaderIds.length) {
    const { data: users } = await admin.auth.admin.listUsers();
    for (const u of users.users) {
      if (uploaderIds.includes(u.id)) emailById.set(u.id, u.email ?? u.id);
    }
  }

  const hasDownloads = trend.some((t) => t.value > 0);

  return (
    <AdminShell title="App Releases">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">App Releases</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">
            Upload, publish and track Android APK releases.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatTile label="Current Version" value={latest?.version ?? "None"} />
          <StatTile label="Release Channel" value={latest?.channel ?? "-"} />
          <StatTile label="APK Size" value={latest ? formatFileSize(latest.file_size) : "-"} />
          <StatTile label="Latest Release Date" value={latest ? formatDateTime(latest.created_at) : "-"} />
          <StatTile label="Total Downloads" value={analytics.total} />
          <StatTile label="Downloads Today" value={analytics.today} />
          <StatTile label="Downloads This Week" value={analytics.thisWeek} />
          <StatTile label="Downloads This Month" value={analytics.thisMonth} />
        </div>

        <UploadReleaseForm />

        {hasDownloads && (
          <AdminCard className="flex flex-col gap-4">
            <AdminCardTitle>Downloads - last 14 days</AdminCardTitle>
            <TrendBarChart data={trend} />
          </AdminCard>
        )}

        <AdminCard className="p-0">
          <div className="p-6 pb-0">
            <AdminCardTitle>Release History</AdminCardTitle>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((r) => {
                const status = r.is_published ? "Published" : r.archived_at ? "Archived" : "Draft";
                const tone = r.is_published ? "good" : r.archived_at ? "neutral" : "warning";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.version}</TableCell>
                    <TableCell>
                      <AdminBadge>{r.channel}</AdminBadge>
                    </TableCell>
                    <TableCell className="text-black/40 dark:text-white/40">{formatFileSize(r.file_size)}</TableCell>
                    <TableCell className="text-black/40 dark:text-white/40">{formatDateTime(r.created_at)}</TableCell>
                    <TableCell className="text-black/40 dark:text-white/40">
                      {(r.uploaded_by && emailById.get(r.uploaded_by)) ?? "-"}
                    </TableCell>
                    <TableCell>{r.download_count}</TableCell>
                    <TableCell>
                      <AdminBadge tone={tone}>{status}</AdminBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ReleaseRowActions
                        id={r.id}
                        version={r.version}
                        isPublished={r.is_published}
                        isArchived={!!r.archived_at}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!releases.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-black/40 dark:text-white/40">
                    No releases yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
