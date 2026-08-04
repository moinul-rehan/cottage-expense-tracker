import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReleasePlatform = "android" | "google_play" | "app_store" | "windows" | "macos" | "linux";
export type ReleaseChannel = "stable" | "beta" | "alpha";

export type AppRelease = {
  id: string;
  platform: ReleasePlatform;
  version: string;
  channel: ReleaseChannel;
  storage_path: string;
  file_size: number;
  sha256: string;
  release_notes: string | null;
  min_supported_version: string | null;
  uploaded_by: string | null;
  is_published: boolean;
  archived_at: string | null;
  download_count: number;
  created_at: string;
};

export const RELEASES_BUCKET = "app-releases";

/** The one release a platform's /download page and /download/latest route
 * serve - published and not archived. See the app_releases_one_active_per_platform
 * partial unique index, which guarantees at most one row can ever match this. */
export async function getLatestPublishedRelease(
  supabase: SupabaseClient,
  platform: ReleasePlatform = "android"
): Promise<AppRelease | null> {
  const { data } = await supabase
    .from("app_releases")
    .select("*")
    .eq("platform", platform)
    .eq("is_published", true)
    .is("archived_at", null)
    .maybeSingle();
  return data;
}

export async function listReleases(
  supabase: SupabaseClient,
  platform: ReleasePlatform = "android"
): Promise<AppRelease[]> {
  const { data } = await supabase
    .from("app_releases")
    .select("*")
    .eq("platform", platform)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getRelease(supabase: SupabaseClient, id: string): Promise<AppRelease | null> {
  const { data } = await supabase.from("app_releases").select("*").eq("id", id).maybeSingle();
  return data;
}

/** Call right as a download actually starts streaming (not just when the
 * download page renders) - bumps the counter and logs a timestamped row for
 * the today/week/month breakdowns in getDownloadAnalytics. */
export async function recordDownload(supabase: SupabaseClient, releaseId: string): Promise<void> {
  await supabase.rpc("increment_release_download_count", { p_release_id: releaseId });
}

export type DownloadAnalytics = {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byVersion: { version: string; count: number }[];
  lastDownloadAt: string | null;
};

/** Aggregates app_release_downloads for every release of a platform (not just
 * the currently-published one - "Downloads Per Version" needs history too). */
export async function getDownloadAnalytics(
  supabase: SupabaseClient,
  platform: ReleasePlatform = "android"
): Promise<DownloadAnalytics> {
  const { data: releases } = await supabase.from("app_releases").select("id, version, download_count").eq("platform", platform);
  const rows = releases ?? [];
  const releaseIds = rows.map((r) => r.id);
  const total = rows.reduce((sum, r) => sum + r.download_count, 0);
  const byVersion = rows
    .map((r) => ({ version: r.version, count: r.download_count }))
    .sort((a, b) => b.count - a.count);

  if (!releaseIds.length) {
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0, byVersion: [], lastDownloadAt: null };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: downloads } = await supabase
    .from("app_release_downloads")
    .select("downloaded_at")
    .in("release_id", releaseIds)
    .order("downloaded_at", { ascending: false });

  const rows2 = downloads ?? [];
  return {
    total,
    today: rows2.filter((d) => d.downloaded_at >= startOfToday).length,
    thisWeek: rows2.filter((d) => d.downloaded_at >= startOfWeek).length,
    thisMonth: rows2.filter((d) => d.downloaded_at >= startOfMonth).length,
    byVersion,
    lastDownloadAt: rows2[0]?.downloaded_at ?? null,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Buckets app_release_downloads by day for the last `days` days (inclusive of
 * today), across every release of a platform - used for the admin "downloads
 * over time" chart. Always returns exactly `days` points, oldest first, with
 * zero-filled gaps so the chart never has holes. */
export async function getDownloadTrend(
  supabase: SupabaseClient,
  platform: ReleasePlatform = "android",
  days = 14
): Promise<{ label: string; value: number }[]> {
  const { data: releases } = await supabase.from("app_releases").select("id").eq("platform", platform);
  const releaseIds = (releases ?? []).map((r) => r.id);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
    });
  }

  if (!releaseIds.length) return buckets.map(({ label, value }) => ({ label, value }));

  const { data: downloads } = await supabase
    .from("app_release_downloads")
    .select("downloaded_at")
    .in("release_id", releaseIds)
    .gte("downloaded_at", start.toISOString());

  const countByKey = new Map<string, number>();
  for (const d of downloads ?? []) {
    const key = d.downloaded_at.slice(0, 10);
    countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
  }

  return buckets.map((b) => ({ label: b.label, value: countByKey.get(b.key) ?? 0 }));
}
