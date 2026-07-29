import Link from "next/link";
import { Building2, Users, TrendingUp } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { Logo } from "@/components/logo";

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
      .select("id, name, plan, subscription_status, created_at")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("id, cottage_id, created_at"),
  ]);

  const memberCountByCottage = new Map<string, number>();
  for (const p of profiles ?? []) {
    memberCountByCottage.set(p.cottage_id, (memberCountByCottage.get(p.cottage_id) ?? 0) + 1);
  }

  const oneWeekAgo = daysAgo(7);
  const newThisWeek = (cottages ?? []).filter((c) => new Date(c.created_at) >= oneWeekAgo).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Logo size={28} />
          Platform Admin
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
          Back to app
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Building2} label="Total Cottages" value={cottages?.length ?? 0} />
        <StatCard icon={Users} label="Total Users" value={profiles?.length ?? 0} />
        <StatCard icon={TrendingUp} label="New Cottages (7d)" value={newThisWeek} />
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
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cottages ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell>{memberCountByCottage.get(c.id) ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {c.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                </TableRow>
              ))}
              {!cottages?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
