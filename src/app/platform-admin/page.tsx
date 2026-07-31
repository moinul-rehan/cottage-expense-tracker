import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import { AdminShell } from "./AdminShell";
import { AdminCard, AdminCardTitle, AdminButton, AdminInput, AdminBadge } from "./AdminUI";
import { TrendAreaChart, TrendBarChart, StatusDonutChart, StatTile, type DonutSlice } from "./AdminCharts";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
] as const;

// Validated status palette (node scripts/validate_palette.js): green/amber
// pass CVD separation together; the neutral gray for "suspended" reads flat
// by design (a paused state, not a hue-competing category) -- every slice is
// still direct-labeled in the donut legend, never color-alone.
const STATUS_COLOR = {
  approved: "#059669",
  pending: "#CA8A04",
  rejected: "#DC2626",
  suspended: "#4B5563",
} as const;

function monthBuckets(n: number) {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    months.push({ label: start.toLocaleDateString("en-US", { month: "short" }), start, end });
  }
  return months;
}

function bucketCounts(rows: { created_at: string }[], buckets: ReturnType<typeof monthBuckets>) {
  return buckets.map((b) => ({
    label: b.label,
    value: rows.filter((r) => {
      const t = new Date(r.created_at);
      return t >= b.start && t < b.end;
    }).length,
  }));
}

function momDelta(counts: { value: number }[]) {
  const thisMonth = counts[counts.length - 1]?.value ?? 0;
  const lastMonth = counts[counts.length - 2]?.value ?? 0;
  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}

function cottageStatusKey(c: { status: string; suspended_at: string | null }): keyof typeof STATUS_COLOR {
  if (c.suspended_at) return "suspended";
  if (c.status === "pending") return "pending";
  if (c.status === "rejected") return "rejected";
  return "approved";
}

function statusTone(key: keyof typeof STATUS_COLOR): "good" | "warning" | "critical" | "neutral" {
  if (key === "approved") return "good";
  if (key === "pending") return "warning";
  if (key === "rejected" || key === "suspended") return "critical";
  return "neutral";
}

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requirePlatformAdmin();
  const { q, status: statusParam } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const statusFilter = STATUS_FILTERS.some((s) => s.value === statusParam) ? statusParam! : "all";

  const admin = createAdminClient();
  const [{ data: cottages }, { data: profiles }] = await Promise.all([
    admin
      .from("cottages")
      .select("id, name, plan, subscription_status, suspended_at, status, created_at")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("id, cottage_id, created_at"),
  ]);

  const allCottages = cottages ?? [];
  const allProfiles = profiles ?? [];

  const memberCountByCottage = new Map<string, number>();
  for (const p of allProfiles) {
    memberCountByCottage.set(p.cottage_id, (memberCountByCottage.get(p.cottage_id) ?? 0) + 1);
  }

  const pendingCount = allCottages.filter((c) => c.status === "pending").length;

  const months12 = monthBuckets(12);
  const months6 = monthBuckets(6);
  const cottageTrend = bucketCounts(allCottages, months12);
  const userTrend = bucketCounts(allProfiles, months6);
  const newCottagesDelta = momDelta(cottageTrend);

  const statusCounts: Record<keyof typeof STATUS_COLOR, number> = {
    approved: 0,
    pending: 0,
    rejected: 0,
    suspended: 0,
  };
  for (const c of allCottages) statusCounts[cottageStatusKey(c)]++;
  const donutSlices: DonutSlice[] = [
    { label: "Approved", value: statusCounts.approved, color: STATUS_COLOR.approved },
    { label: "Pending", value: statusCounts.pending, color: STATUS_COLOR.pending },
    { label: "Rejected", value: statusCounts.rejected, color: STATUS_COLOR.rejected },
    { label: "Suspended", value: statusCounts.suspended, color: STATUS_COLOR.suspended },
  ].filter((s) => s.value > 0);

  const topCottages = [...allCottages]
    .sort((a, b) => (memberCountByCottage.get(b.id) ?? 0) - (memberCountByCottage.get(a.id) ?? 0))
    .slice(0, 6);

  const recentCottages = allCottages.slice(0, 6);

  const filteredCottages = allCottages.filter((c) => {
    if (query && !c.name.toLowerCase().includes(query)) return false;
    if (statusFilter !== "all" && cottageStatusKey(c) !== statusFilter) return false;
    return true;
  });

  return (
    <AdminShell title="Overview">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatTile label="Total Cottages" value={allCottages.length} />
          <StatTile label="Total Users" value={allProfiles.length} />
          <StatTile label="New Cottages this month" value={cottageTrend[cottageTrend.length - 1]?.value ?? 0} delta={newCottagesDelta} />
          <StatTile label="Pending Approval" value={pendingCount} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AdminCard className="lg:col-span-2">
            <AdminCardTitle className="mb-4">Cottage signups (12 months)</AdminCardTitle>
            <TrendAreaChart data={cottageTrend} />
          </AdminCard>
          <AdminCard>
            <AdminCardTitle className="mb-4">Cottages by status</AdminCardTitle>
            {donutSlices.length ? (
              <StatusDonutChart slices={donutSlices} />
            ) : (
              <p className="py-8 text-center text-sm text-black/40 dark:text-white/40">No cottages yet.</p>
            )}
          </AdminCard>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AdminCard className="lg:col-span-2">
            <AdminCardTitle className="mb-4">New users (6 months)</AdminCardTitle>
            <TrendBarChart data={userTrend} />
          </AdminCard>
          <AdminCard className="flex flex-col">
            <AdminCardTitle className="mb-3">Top Cottages by members</AdminCardTitle>
            <div className="flex flex-col gap-1">
              {topCottages.map((c) => {
                const count = memberCountByCottage.get(c.id) ?? 0;
                const max = memberCountByCottage.get(topCottages[0]?.id ?? "") || 1;
                return (
                  <Link
                    key={c.id}
                    href={`/platform-admin/cottages/${c.id}`}
                    className="flex flex-col gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-black/4 dark:hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      <span className="shrink-0 tabular-nums text-black/40 dark:text-white/40">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/4 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-black dark:bg-white"
                        style={{ width: `${Math.max((count / max) * 100, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
              {!topCottages.length && (
                <p className="py-8 text-center text-sm text-black/40 dark:text-white/40">No cottages yet.</p>
              )}
            </div>
          </AdminCard>
        </div>

        <AdminCard>
          <AdminCardTitle className="mb-3">Recent signups</AdminCardTitle>
          <div className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
            {recentCottages.map((c) => (
              <Link
                key={c.id}
                href={`/platform-admin/cottages/${c.id}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0 hover:opacity-70"
              >
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-black/40 dark:text-white/40">{formatDate(c.created_at)}</span>
              </Link>
            ))}
            {!recentCottages.length && (
              <p className="py-6 text-center text-sm text-black/40 dark:text-white/40">No cottages yet.</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardTitle className="mb-4">All Cottages</AdminCardTitle>
          <div className="flex flex-col gap-4">
            <form className="flex flex-wrap gap-2">
              <AdminInput name="q" defaultValue={query} placeholder="Search by name…" className="max-w-xs" />
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-9 rounded-lg border-[0.5px] border-black/10 bg-black/[0.02] px-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <AdminButton type="submit" variant="outline">
                Filter
              </AdminButton>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCottages.map((c) => {
                  const key = cottageStatusKey(c);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`/platform-admin/cottages/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>{memberCountByCottage.get(c.id) ?? 0}</TableCell>
                      <TableCell>
                        <AdminBadge>{c.plan}</AdminBadge>
                      </TableCell>
                      <TableCell>
                        <AdminBadge tone={statusTone(key)}>
                          {key === "pending" ? "Pending approval" : key === "approved" ? c.subscription_status : key}
                        </AdminBadge>
                      </TableCell>
                      <TableCell className="text-black/40 dark:text-white/40">{formatDate(c.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
                {!filteredCottages.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-black/40 dark:text-white/40">
                      {query || statusFilter !== "all" ? "No matching cottages." : "No cottages yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
