import Link from "next/link";
import { Building2, Users, TrendingUp, Hourglass } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { PlatformAdminNav } from "./PlatformAdminNav";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return (
    <Card className="flex-row items-center gap-4 rounded-2xl p-5">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </div>
    </Card>
  );
}

export default async function PlatformAdminPage() {
  await requirePlatformAdmin();

  const admin = createAdminClient();
  const [{ data: cottages }, { data: profiles }] = await Promise.all([
    admin
      .from("cottages")
      .select("id, name, plan, subscription_status, suspended_at, status, created_at")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("id, cottage_id, created_at"),
  ]);

  const memberCountByCottage = new Map<string, number>();
  for (const p of profiles ?? []) {
    memberCountByCottage.set(p.cottage_id, (memberCountByCottage.get(p.cottage_id) ?? 0) + 1);
  }

  const oneWeekAgo = daysAgo(7);
  const newThisWeek = (cottages ?? []).filter((c) => new Date(c.created_at) >= oneWeekAgo).length;
  const pendingCount = (cottages ?? []).filter((c) => c.status === "pending").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <PlatformAdminNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={Building2} label="Total Cottages" value={cottages?.length ?? 0} />
        <StatCard icon={Users} label="Total Users" value={profiles?.length ?? 0} />
        <StatCard icon={TrendingUp} label="New Cottages (7d)" value={newThisWeek} />
        <StatCard icon={Hourglass} label="Pending Approval" value={pendingCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cottages</CardTitle>
        </CardHeader>
        <CardContent>
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
              {(cottages ?? []).map((c) => (
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
              {!cottages?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No cottages yet.
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
