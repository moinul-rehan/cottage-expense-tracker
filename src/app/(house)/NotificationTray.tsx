"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Bell } from "@/components/animate-ui/icons/bell";
import { markNotificationRead } from "./notifications/actions";
import { getNotificationIcon } from "./notification-icons";
import { LocalDateTime } from "@/components/LocalDateTime";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
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

const COLLAPSED_PEEK_COUNT = 3;
const DISMISS_DRAG_PX = 70;
const TRANSITION_MS = 280;

export function NotificationTray({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const bell = (
    <span className="relative flex size-[42px] items-center justify-center rounded-full border border-border bg-card">
      <Bell className="size-5 text-foreground" />
      {unreadCount > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />}
    </span>
  );

  // The full-screen swipe drawer is a mobile pattern -- on desktop this is
  // just a lightweight dropdown anchored to the bell, no drag/dismiss.
  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<button type="button" />}>{bell}</PopoverTrigger>
        <PopoverContent align="end" className="flex w-96 flex-col gap-0 p-0">
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
          </div>
          <div className="flex max-h-96 flex-col gap-1 overflow-y-auto px-2 pb-2">
            <NotificationList notifications={notifications} />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {bell}
      </button>
      {open && (
        <NotificationSheetBody
          notifications={notifications}
          unreadCount={unreadCount}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  );
}

function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (!notifications.length) {
    return <p className="px-2 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>;
  }

  return (
    <>
      {notifications.map((n) => {
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
                {!n.is_read && <MarkReadButton id={n.id} />}
              </div>
              {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
              <p className="text-xs text-muted-foreground/70">
                <LocalDateTime iso={n.created_at} />
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** A real swipe-driven bottom sheet: opens by sliding up from off-screen to
 * a "peek" height that covers the last few notifications; dragging the
 * handle -- or the header row above the list -- further up expands it to
 * near-full-screen, and dragging it down (past a threshold) slides it back
 * off-screen and dismisses. The scrollable list itself is excluded from the
 * drag surface so it can still be scrolled without fighting the sheet. */
function NotificationSheetBody({
  notifications,
  unreadCount,
  onDismiss,
}: {
  notifications: Notification[];
  unreadCount: number;
  onDismiss: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [expandedPx, setExpandedPx] = useState(0);
  const [peekOffsetPx, setPeekOffsetPx] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [animate, setAnimate] = useState(false);
  const ready = useRef(false);

  const dragState = useRef<{ startY: number; startTranslate: number } | null>(null);

  // While the sheet is open, the page behind the backdrop shouldn't scroll.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Measure viewport-derived snap points, then slide in from off-screen to
  // the collapsed "peek" position.
  useLayoutEffect(() => {
    const expanded = Math.round(window.innerHeight * 0.92);
    setExpandedPx(expanded);

    let peekHeight = 220;
    const list = listRef.current;
    const lastItem = itemRefs.current.get(Math.min(COLLAPSED_PEEK_COUNT, notifications.length) - 1);
    if (list && lastItem) {
      const headerHeight = list.getBoundingClientRect().top - containerRef.current!.getBoundingClientRect().top;
      const itemsHeight = lastItem.getBoundingClientRect().bottom - list.getBoundingClientRect().top;
      peekHeight = Math.min(expanded - 40, Math.max(240, headerHeight + itemsHeight + 24));
    }
    const offset = expanded - peekHeight;
    setPeekOffsetPx(offset);

    setTranslateY(expanded); // fully off-screen
    requestAnimationFrame(() => {
      setAnimate(true);
      requestAnimationFrame(() => {
        setTranslateY(offset);
        ready.current = true;
      });
    });
  }, [notifications.length]);

  function dismiss() {
    setAnimate(true);
    setTranslateY(expandedPx);
    setTimeout(onDismiss, TRANSITION_MS);
  }

  function onDragPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!ready.current) return;
    // When the list is expanded and already scrolled into its content,
    // a touch on it should scroll the list, not drag the sheet -- only
    // take over the gesture once the list is back at its top.
    if (expanded && (listRef.current?.scrollTop ?? 0) > 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startY: e.clientY, startTranslate: translateY };
    setAnimate(false);
  }

  function onDragPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const delta = e.clientY - dragState.current.startY;
    const next = Math.min(expandedPx, Math.max(0, dragState.current.startTranslate + delta));
    setTranslateY(next);
  }

  function onDragPointerUp() {
    if (!dragState.current) return;
    const dragged = dragState.current;
    dragState.current = null;
    setAnimate(true);

    if (translateY >= peekOffsetPx + DISMISS_DRAG_PX && translateY > dragged.startTranslate) {
      dismiss();
      return;
    }

    const midpoint = peekOffsetPx / 2;
    setTranslateY(translateY <= midpoint ? 0 : peekOffsetPx);
  }

  const expanded = translateY <= peekOffsetPx / 2;
  const dragHandlers = {
    onPointerDown: onDragPointerDown,
    onPointerMove: onDragPointerMove,
    onPointerUp: onDragPointerUp,
    onPointerCancel: onDragPointerUp,
  };

  const body = (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
        onClick={dismiss}
        style={{ opacity: ready.current ? 1 : 0, transition: `opacity ${TRANSITION_MS}ms ease` }}
      />
      <div
        ref={containerRef}
        className="fixed inset-x-0 bottom-0 z-[80] mx-auto flex w-full max-w-lg touch-none flex-col overflow-hidden rounded-t-2xl border-t border-border bg-popover text-sm text-popover-foreground shadow-lg"
        style={{
          height: expandedPx || "92dvh",
          transform: `translateY(${translateY}px)`,
          transition: animate ? `transform ${TRANSITION_MS}ms ease` : "none",
        }}
      >
        <div
          {...dragHandlers}
          className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-1.5 pt-2.5 pb-1 active:cursor-grabbing"
        >
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <h2 className="sr-only">Notifications</h2>

        <div
          {...dragHandlers}
          className="flex shrink-0 cursor-grab touch-none items-center justify-between px-4 py-1.5 active:cursor-grabbing"
        >
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && <span className="text-xs text-muted-foreground">{unreadCount} unread</span>}
        </div>

        <div
          ref={listRef}
          {...dragHandlers}
          className={cn(
            "flex flex-1 flex-col gap-1 px-2 pb-4 touch-pan-y",
            expanded ? "overflow-y-auto" : "overflow-hidden"
          )}
        >
          {notifications.map((n, i) => {
            const Icon = getNotificationIcon(n.type);
            return (
              <div
                key={n.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(i, el);
                }}
                className={"flex gap-2.5 rounded-lg px-2 py-2 " + (n.is_read ? "" : "bg-accent/40")}
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="size-3.5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.is_read && <MarkReadButton id={n.id} />}
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
        </div>
      </div>
    </>
  );

  return createPortal(body, document.body);
}

function MarkReadButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markNotificationRead(id))}
      className="shrink-0 text-xs text-primary hover:underline"
    >
      Mark read
    </button>
  );
}
