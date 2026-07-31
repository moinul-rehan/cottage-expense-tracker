import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { PlatformAdminNav } from "./PlatformAdminNav";
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <PlatformAdminNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile label="Total Cottages" value={allCottages.length} />
        <StatTile label="Total Users" value={allProfiles.length} />
        <StatTile label="New Cottages this month" value={cottageTrend[cottageTrend.length - 1]?.value ?? 0} delta={newCottagesDelta} />
        <StatTile label="Pending Approval" value={pendingCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Cottage signups (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendAreaChart data={cottageTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cottages by status</CardTitle>
          </CardHeader>
          <CardContent>
            {donutSlices.length ? (
              <StatusDonutChart slices={donutSlices} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No cottages yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">New users (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendBarChart data={userTrend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Cottages by members</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {topCottages.map((c) => {
              const count = memberCountByCottage.get(c.id) ?? 0;
              const max = memberCountByCottage.get(topCottages[0]?.id ?? "") || 1;
              return (
                <Link
                  key={c.id}
                  href={`/platform-admin/cottages/${c.id}`}
                  className="flex flex-col gap-1 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-foreground">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max((count / max) * 100, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
            {!topCottages.length && <p className="py-8 text-center text-sm text-muted-foreground">No cottages yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent signups</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {recentCottages.map((c) => (
            <Link
              key={c.id}
              href={`/platform-admin/cottages/${c.id}`}
              className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0 hover:text-primary"
            >
              <span className="truncate font-medium text-foreground">{c.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatDate(c.created_at)}</span>
            </Link>
          ))}
          {!recentCottages.length && <p className="py-6 text-center text-sm text-muted-foreground">No cottages yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Cottages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-wrap gap-2">
            <Input name="q" defaultValue={query} placeholder="Search by name…" className="max-w-xs" />
            <select
              name="status"
              defaultValue={statusFilter}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
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
              {filteredCottages.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/platform-admin/cottages/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>{memberCountByCottage.get(c.id) ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {c.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.status === "pending" ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Pending approval
                      </Badge>
                    ) : c.status === "rejected" ? (
                      <Badge variant="destructive">Rejected</Badge>
                    ) : c.suspended_at ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {c.subscription_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
              {!filteredCottages.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {query || statusFilter !== "all" ? "No matching cottages." : "No cottages yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
