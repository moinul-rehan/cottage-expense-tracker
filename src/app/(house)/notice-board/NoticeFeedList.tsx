"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { NOTICE_TYPE_META, PRIORITY_META, sortForDisplay, type NoticeType, type NoticePriority } from "@/lib/notice-types";
import type { NoticeRow } from "@/lib/data/notice-board";
import { NoticeCard } from "./NoticeCard";

type Member = { id: string; first_name: string; last_name: string | null };

export function NoticeFeedList({
  notices,
  membersById,
  profile,
}: {
  notices: NoticeRow[];
  membersById: Map<string, Member>;
  profile: { id: string; role: "super_admin" | "member" };
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [pinned, setPinned] = useState<string>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = notices.filter((n) => {
      if (type !== "all" && n.type !== type) return false;
      if (priority !== "all" && n.priority !== priority) return false;
      if (pinned === "pinned" && !n.is_pinned) return false;
      if (pinned === "unpinned" && n.is_pinned) return false;
      if (needle && !(n.title + " " + n.description).toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortForDisplay(list);
  }, [notices, q, type, priority, pinned]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or description…"
          className="min-w-48 flex-1"
        />
        <Select value={type} onValueChange={(v) => setType(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(NOTICE_TYPE_META) as NoticeType[]).map((t) => (
              <SelectItem key={t} value={t}>{NOTICE_TYPE_META[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {(Object.keys(PRIORITY_META) as NoticePriority[]).map((p) => (
              <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pinned} onValueChange={(v) => setPinned(v ?? "all")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Pinned + unpinned</SelectItem>
            <SelectItem value="pinned">Pinned only</SelectItem>
            <SelectItem value="unpinned">Unpinned only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => (
            <NoticeCard key={n.id} notice={n} membersById={membersById} profile={profile} context="feed" />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-sm text-muted-foreground">No notices match those filters.</Card>
      )}
    </div>
  );
}
