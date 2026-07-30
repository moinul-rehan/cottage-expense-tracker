"use client";

import { useState, useTransition, type CSSProperties } from "react";
import { TriangleAlert } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { dismissNotice } from "../notice-board/actions";
import { NOTICE_TYPE_META, PRIORITY_META, noticeTilt, type NoticeType } from "@/lib/notice-types";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type PopupNotice = {
  id: string;
  type: string;
  priority: "critical" | "high" | "normal" | "low";
  title: string;
  description: string;
  due_amount: number | null;
  due_date: string | null;
  meal_lunch: string | null;
  meal_dinner: string | null;
  publish_at: string;
};

/** Every new "everyone" notice pops up big and centered the first time a
 * member loads the dashboard after it's published - closing it (X) marks it
 * dismissed for that member permanently (see notice_dismissals). Shows one
 * at a time; the next undismissed one (if any) appears once this one closes. */
export function NoticePopup({ notices }: { notices: PopupNotice[] }) {
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const notice = notices[index];

  if (!notice) return null;

  const meta = NOTICE_TYPE_META[notice.type as NoticeType];
  const Icon = meta.icon;
  const isCritical = notice.priority === "critical";
  const tilt = noticeTilt(notice.id);

  function handleClose() {
    startTransition(() => dismissNotice(notice.id));
    setIndex((i) => i + 1);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && handleClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          "max-w-md rounded-sm bg-clip-padding p-0 text-[var(--paper-ink)] ring-0 [transform:translate(-50%,-50%)_rotate(var(--tilt))]",
          meta.paper,
          notice.type === "emergency" && "border-t-4 border-t-red-600",
          isCritical && "ring-2 ring-red-600 ring-offset-2 ring-offset-background"
        )}
        style={{ "--tilt": `${tilt}deg` } as CSSProperties}
      >
        {isCritical && (
          <div className="flex items-center justify-center gap-1 bg-red-600 py-1.5 text-xs font-extrabold tracking-wider text-white uppercase">
            <TriangleAlert className="size-3.5" />
            Critical
          </div>
        )}

        <div className="flex flex-col gap-3 p-6 pt-5">
          <span className="inline-flex items-center gap-1.5 self-start text-xs font-extrabold tracking-wide uppercase opacity-75">
            <Icon className="size-4" />
            {meta.label}
          </span>

          <h2 className="text-xl leading-snug font-extrabold text-balance">{notice.title}</h2>

          {notice.type === "utility" && notice.due_amount != null ? (
            <p className="text-sm leading-snug">
              <span className="block text-2xl font-extrabold">{notice.due_amount.toFixed(2)} BDT</span>
              {notice.description && (
                <>
                  {notice.description}
                  <br />
                </>
              )}
              {notice.due_date && <>Due {formatDate(notice.due_date)}</>}
            </p>
          ) : notice.type === "meal" && (notice.meal_lunch || notice.meal_dinner) ? (
            <p className="text-sm leading-snug">
              {notice.meal_lunch && (
                <>
                  <b>Lunch</b> - {notice.meal_lunch}
                  <br />
                </>
              )}
              {notice.meal_dinner && (
                <>
                  <b>Dinner</b> - {notice.meal_dinner}
                </>
              )}
            </p>
          ) : (
            notice.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed">{notice.description}</p>
            )
          )}

          <div className="mt-1 flex items-center gap-1.5 border-t border-dashed border-black/20 pt-3 text-xs">
            <span className="font-semibold">{PRIORITY_META[notice.priority].label}</span>
            <span aria-hidden>·</span>
            <span>Just posted</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
