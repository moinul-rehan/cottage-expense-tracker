"use client";

import { useTransition } from "react";
import { Pin, PinOff, Archive, Send } from "lucide-react";
import { setNoticePinned, archiveNotice, publishNoticeNow } from "./actions";
import { Button } from "@/components/ui/button";

export function NoticeCardActions({
  id,
  isPinned,
  isScheduled = false,
  isArchived,
}: {
  id: string;
  isPinned: boolean;
  isScheduled?: boolean;
  isArchived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (isArchived) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
      {isScheduled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => publishNoticeNow(id))}
          className="gap-1.5"
        >
          <Send className="size-3.5" />
          Publish now
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => setNoticePinned(id, !isPinned))}
        className="gap-1.5"
      >
        {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
        {isPinned ? "Unpin" : "Pin"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm("Archive this notice? It stays in Notice History but leaves the board.")) {
            startTransition(() => archiveNotice(id));
          }
        }}
        className="gap-1.5 text-muted-foreground"
      >
        <Archive className="size-3.5" />
        Archive
      </Button>
    </div>
  );
}
