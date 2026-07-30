"use client";

import { useState, useTransition } from "react";
import { Bell, ChevronUp, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { markNotificationRead } from "./notifications/actions";
import { getNotificationIcon } from "./notification-icons";
import { LocalDateTime } from "@/components/LocalDateTime";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const COLLAPSED_COUNT = 5;

export function NotificationTray({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const visible = expanded ? notifications : notifications.slice(0, COLLAPSED_COUNT);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setExpanded(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex size-[42px] items-center justify-center rounded-full border border-border bg-card"
      >
        <Bell className="size-5 text-foreground" />
        {unreadCount > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />}
      </button>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "mx-auto w-full max-w-lg rounded-t-2xl p-0 transition-[height] duration-300",
          expanded ? "h-[92dvh]" : "h-[58dvh]"
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full flex-col items-center gap-1.5 pt-2.5 pb-1"
          aria-label={expanded ? "Collapse notifications" : "Expand to see all notifications"}
        >
          <span className="h-1.5 w-10 rounded-full bg-border" />
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-4 text-muted-foreground" />
          )}
        </button>

        <SheetTitle className="sr-only">Notifications</SheetTitle>

        <div className="flex items-center justify-between px-4 py-1.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          {visible.map((n) => {
            const Icon = getNotificationIcon(n.type);
            return (
              <div
                key={n.id}
                className={"flex gap-2.5 rounded-lg px-2 py-2 " + (n.is_read ? "" : "bg-accent/40")}
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-3.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.is_read && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startTransition(() => markNotificationRead(n.id))}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="text-xs text-muted-foreground/70">
                    <LocalDateTime iso={n.created_at} />
                  </p>
                </div>
              </div>
            );
          })}
          {!notifications.length && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
          {!expanded && notifications.length > COLLAPSED_COUNT && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-1 rounded-full py-2 text-center text-xs font-semibold text-primary hover:underline"
            >
              Slide up to see all {notifications.length}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
