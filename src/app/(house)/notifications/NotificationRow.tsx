"use client";

import { useTransition } from "react";
import Link from "next/link";
import { markNotificationRead } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { NOTIFICATION_ICONS, getPlatformCategoryLabel } from "../notification-icons";
import { isExternalLink } from "../notification-link";
import { Bell } from "lucide-react";
import { LocalDateTime } from "@/components/LocalDateTime";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationRow({ notification }: { notification: Notification }) {
  const [pending, startTransition] = useTransition();
  const NotificationIcon = NOTIFICATION_ICONS[notification.type] ?? Bell;
  const categoryLabel = getPlatformCategoryLabel(notification.type);

  return (
    <TableRow className={notification.is_read ? undefined : "bg-accent/40"}>
      <TableCell>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <NotificationIcon className="size-3.5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
              {notification.title}
              {categoryLabel && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                  {categoryLabel}
                </span>
              )}
              {!notification.is_read && <Badge variant="default">New</Badge>}
            </span>
            {notification.body && <span className="text-sm text-muted-foreground">{notification.body}</span>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <LocalDateTime iso={notification.created_at} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {notification.link && (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                isExternalLink(notification.link) ? (
                  <a href={notification.link} target="_blank" rel="noopener noreferrer" />
                ) : (
                  <Link href={notification.link} />
                )
              }
            >
              View
            </Button>
          )}
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => markNotificationRead(notification.id))}
            >
              Mark read
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
