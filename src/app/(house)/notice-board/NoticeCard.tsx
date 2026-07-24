import type { CSSProperties } from "react";
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
  noticeTilt,
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

  const tilt = pinned ? noticeTilt(notice.id) : 0;
  const ink = "text-[var(--paper-ink)]";

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2.5 rounded-sm p-4 pt-5 text-[var(--paper-ink)] shadow-[0_10px_18px_-10px_rgba(20,10,0,.45),0_2px_4px_rgba(20,10,0,.18)] transition-transform [transform:rotate(var(--tilt))] hover:z-10 hover:[transform:translateY(-2px)_rotate(0deg)]",
        meta.paper,
        status === "scheduled" && "opacity-60 saturate-[.6]",
        notice.type === "emergency" && "border-t-4 border-t-red-600"
      )}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      {/* folded corner */}
      <span className="absolute right-0 bottom-0 size-0 border-r-[16px] border-b-[16px] border-r-transparent border-b-black/15" aria-hidden />

      {pinned && (
        <span
          className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full after:absolute after:top-full after:left-1/2 after:h-1.5 after:w-px after:-translate-x-1/2 after:bg-black/25"
          title={`${PRIORITY_META[notice.priority].label} priority — pinned to dashboard`}
        >
          <span className={cn("absolute inset-0 rounded-full shadow-[0_2px_3px_rgba(0,0,0,.45),inset_0_-2px_2px_rgba(0,0,0,.3),inset_0_2px_2px_rgba(255,255,255,.55)]", PRIORITY_META[notice.priority].pin)} />
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 text-[10.5px] font-extrabold tracking-wide uppercase opacity-75", ink)}>
          <Icon className="size-3.5" />
          {meta.label}
        </span>
        <div className="flex items-center gap-1">
          {status === "scheduled" && <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase">Not posted yet</span>}
          {status === "expired" && <span className="rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase">Expired</span>}
        </div>
      </div>

      <h3 className={cn("text-sm leading-snug font-extrabold", ink)}>{notice.title}</h3>

      {notice.type === "utility" && notice.due_amount != null ? (
        <p className={cn("text-xs leading-snug", ink)}>
          <span className="block text-base font-extrabold">{notice.due_amount.toFixed(2)} BDT</span>
          {notice.description && <>{notice.description}<br /></>}
          {notice.due_date && <>Due {formatDate(notice.due_date)}</>}
        </p>
      ) : notice.type === "meal" && (notice.meal_lunch || notice.meal_dinner) ? (
        <p className={cn("text-xs leading-snug", ink)}>
          {notice.meal_lunch && (
            <>
              <b>Lunch</b> — {notice.meal_lunch}
              <br />
            </>
          )}
          {notice.meal_dinner && (
            <>
              <b>Dinner</b> — {notice.meal_dinner}
            </>
          )}
        </p>
      ) : (
        notice.description && <p className={cn("whitespace-pre-line text-xs leading-snug", ink)}>{notice.description}</p>
      )}

      <div className={cn("mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-dashed border-black/20 pt-2 text-[10.5px]", ink)}>
        <span className="font-semibold">
          {PRIORITY_META[notice.priority].label}
        </span>
        <span aria-hidden>·</span>
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
        <div className="[&_button]:border-black/20 [&_button]:bg-white/50 [&_button]:text-[var(--paper-ink)] [&_button:hover]:bg-white/80">
          <NoticeCardActions id={notice.id} isPinned={notice.is_pinned} isScheduled={status === "scheduled"} isArchived={status === "archived"} />
        </div>
      )}
    </div>
  );
}
