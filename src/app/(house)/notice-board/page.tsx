import Link from "next/link";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getNotices } from "@/lib/data/notice-board";
import { NOTICE_TYPE_META, PRIORITY_META, VISIBILITY_LABEL, canCreateAnyNotice, computeStatus, sortForDisplay } from "@/lib/notice-types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { NoticeFeedList } from "./NoticeFeedList";
import { NoticeCard } from "./NoticeCard";
import { CreateNoticeForm } from "./CreateNoticeForm";

const TABS = [
  { value: "feed", label: "Notice Feed" },
  { value: "create", label: "Create Notice" },
  { value: "scheduled", label: "Scheduled Notices" },
  { value: "history", label: "Notice History" },
] as const;

export default async function NoticeBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [notices, { data: members }] = await Promise.all([
    getNotices(supabase, profile.cottage_id),
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
  ]);
  const membersById = new Map((members ?? []).map((m) => [m.id, m]));

  const canManage = canCreateAnyNotice(profile);
  const availableTabs = TABS.filter((t) => canManage || t.value === "feed");
  const tab = availableTabs.some((t) => t.value === tabParam) ? tabParam! : "feed";

  const feedNotices = notices.filter((n) => computeStatus(n) === "published");
  const scheduledNotices = sortForDisplay(notices.filter((n) => computeStatus(n) === "scheduled"));
  const historyNotices = sortForDisplay(notices);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Notice Board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The house&apos;s communication hub — independent of Meal, Utilities and Cottage Balance.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 text-sm">
        {availableTabs.map((t) => (
          <Link
            key={t.value}
            href={`/notice-board?tab=${t.value}`}
            className={cn(
              "rounded-md px-2.5 py-1",
              tab === t.value ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "feed" &&
        (feedNotices.length ? (
          <NoticeFeedList notices={feedNotices} membersById={membersById} profile={profile} />
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">No active notices right now.</Card>
        ))}

      {tab === "create" && canManage && <CreateNoticeForm profile={profile} members={members ?? []} />}

      {tab === "scheduled" && canManage && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">Publishes automatically once its publish time arrives.</p>
          {scheduledNotices.length ? (
            <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
              {scheduledNotices.map((n) => (
                <NoticeCard key={n.id} notice={n} membersById={membersById} profile={profile} context="scheduled" />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center text-sm text-muted-foreground">Nothing scheduled.</Card>
          )}
        </div>
      )}

      {tab === "history" && canManage && (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Pinned</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyNotices.map((n) => {
                const meta = NOTICE_TYPE_META[n.type];
                const status = computeStatus(n);
                const creator = n.is_anonymous ? "Cottage" : getDisplayName(membersById.get(n.created_by) ?? { first_name: "Member", last_name: null });
                return (
                  <TableRow key={n.id}>
                    <TableCell className="whitespace-normal font-medium text-foreground">{n.title}</TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", meta.chip)}>{meta.label}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {creator}
                      {n.is_anonymous && <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">anon</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(n.publish_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(n.expires_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{VISIBILITY_LABEL[n.visibility]}</TableCell>
                    <TableCell>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold uppercase", PRIORITY_META[n.priority].pill)}>
                        {PRIORITY_META[n.priority].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{n.is_pinned ? "Yes" : "—"}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{status}</TableCell>
                  </TableRow>
                );
              })}
              {!historyNotices.length && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No notices yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
