import { Card } from "@/components/ui/card";
import { getDisplayName } from "@/lib/data/display-name";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import {
  NOTICE_TYPE_META,
  PRIORITY_META,
  VISIBILITY_LABEL,
  canManageNotice,
  computeStatus,
  isEffectivelyPinned,
  type NoticeType,
} from "@/lib/notice-types";
import type { NoticeRow } from "@/lib/data/notice-board";
import { NoticeCardActions } from "./NoticeCardActions";

type Member = { id: string; first_name: string; last_name: string | null };

export function NoticeCard({
  notice,
  membersById,
  profile,
  context = "feed",
}: {
  notice: NoticeRow;
  membersById: Map<string, Member>;
  profile: { id: string; role: "super_admin" | "member" };
  context?: "dashboard" | "feed" | "scheduled";
}) {
  const meta = NOTICE_TYPE_META[notice.type as NoticeType];
  const Icon = meta.icon;
  const status = computeStatus(notice);
  const pinned = isEffectivelyPinned(notice);
  const canManage = canManageNotice(profile, notice) && context !== "dashboard";
  const creatorName = notice.is_anonymous ? "Cottage" : getDisplayName(membersById.get(notice.created_by) ?? { first_name: "Member", last_name: null });

  const targetNames = notice.target_member_ids
    .map((id) => membersById.get(id))
    .filter(Boolean)
    .map((m) => getDisplayName(m!));

  return (
    <Card
      className={cn(
        "relative gap-3 rounded-2xl p-4",
        notice.type === "emergency" && "border-red-300 dark:border-red-900"
      )}
    >
      {pinned && (
        <span
          className={cn("absolute -top-2 left-5 size-3.5 rounded-full ring-2 ring-card", meta.pin)}
          title="Pinned to dashboard"
          aria-hidden
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.chip)}>
            <Icon className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.chip)}>
              {meta.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", PRIORITY_META[notice.priority].pill)}>
            {PRIORITY_META[notice.priority].label}
          </span>
          {status === "scheduled" && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Scheduled</span>}
          {status === "expired" && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Expired</span>}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">{notice.title}</h3>
        {notice.type === "utility" && notice.due_amount != null ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="text-base font-bold text-foreground">{notice.due_amount.toFixed(2)} BDT</span>
            {notice.description && <> — {notice.description}</>}
            {notice.due_date && <> · Due {formatDate(notice.due_date)}</>}
          </p>
        ) : notice.type === "meal" && (notice.meal_lunch || notice.meal_dinner) ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {notice.meal_lunch && (
              <>
                <span className="font-medium text-foreground">Lunch</span> — {notice.meal_lunch}
                <br />
              </>
            )}
            {notice.meal_dinner && (
              <>
                <span className="font-medium text-foreground">Dinner</span> — {notice.meal_dinner}
              </>
            )}
          </p>
        ) : (
          notice.description && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{notice.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{creatorName}</span>
        <span aria-hidden>·</span>
        <span>
          {status === "scheduled" ? `publishes ${formatDateTime(notice.publish_at)}` : formatDateTime(notice.created_at)}
        </span>
        <span aria-hidden>·</span>
        <span>{status === "expired" ? `Expired ${formatDateTime(notice.expires_at)}` : `Expires ${formatDateTime(notice.expires_at)}`}</span>
        {notice.visibility !== "everyone" && (
          <>
            <span aria-hidden>·</span>
            <span>
              {VISIBILITY_LABEL[notice.visibility]}
              {targetNames.length ? `: ${targetNames.join(", ")}` : ""}
            </span>
          </>
        )}
      </div>

      {canManage && (
        <NoticeCardActions id={notice.id} isPinned={notice.is_pinned} isArchived={status === "archived"} />
      )}
    </Card>
  );
}
