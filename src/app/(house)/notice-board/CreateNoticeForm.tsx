"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createNotice, type CreateNoticeState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";
import { cn } from "@/lib/utils";
import {
  NOTICE_TYPE_META,
  PRIORITY_META,
  VISIBILITY_LABEL,
  PIN_DURATION_LABEL,
  canCreateNoticeType,
  type NoticeType,
  type NoticeVisibility,
  type NoticePriority,
  type PinDuration,
} from "@/lib/notice-types";

type Member = { id: string; first_name: string; last_name: string | null };

const ALL_TYPES = Object.keys(NOTICE_TYPE_META) as NoticeType[];
const ALL_PRIORITIES = Object.keys(PRIORITY_META) as NoticePriority[];
const ALL_PIN_DURATIONS = Object.keys(PIN_DURATION_LABEL) as PinDuration[];

export function CreateNoticeForm({
  profile,
  members,
  onSuccess,
}: {
  profile: { id: string; role: "super_admin" | "member"; can_add_notice: boolean };
  members: Member[];
  onSuccess?: () => void;
}) {
  const [state, action, pending] = useActionState<CreateNoticeState, FormData>(createNotice, undefined);

  useEffect(() => {
    if (state?.success) onSuccess?.();
    // Only fire when a fresh success comes back from the server action —
    // onSuccess itself must not be a dependency, or a parent passing a new
    // callback identity on every render would re-fire this immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const allowedTypes = useMemo(
    () => ALL_TYPES.filter((t) => canCreateNoticeType(profile, t)),
    [profile]
  );

  const [type, setType] = useState<NoticeType | null>(null);
  const [visibility, setVisibility] = useState<NoticeVisibility | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [pinDuration, setPinDuration] = useState<PinDuration>("until_manual");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("09:00");
  const [expireDate, setExpireDate] = useState("");
  const [expireTime, setExpireTime] = useState("23:59");

  // Built from local <input type="date"/"time"> values here in the browser,
  // where `new Date(...)` correctly resolves against the visitor's own
  // timezone — computing this server-side would use the server's timezone
  // instead and silently publish/expire notices at the wrong wall-clock time.
  const publishAtIso = useMemo(() => {
    if (!publishDate) return "";
    const d = new Date(`${publishDate}T${publishTime || "00:00"}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [publishDate, publishTime]);
  const expiresAtIso = useMemo(() => {
    if (!expireDate) return "";
    const d = new Date(`${expireDate}T${expireTime || "23:59"}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [expireDate, expireTime]);

  if (!allowedTypes.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        You don&apos;t have permission to create notices yet — ask your admin to grant it in Members.
      </p>
    );
  }

  const targetOptions = type ? NOTICE_TYPE_META[type].visibilities : [];
  const needsTargets = visibility === "specific" || visibility === "selected";

  function pickType(next: NoticeType) {
    setType(next);
    setVisibility(null);
    setTargetIds([]);
  }

  function pickVisibility(next: NoticeVisibility) {
    setVisibility(next);
    setTargetIds([]);
  }

  function toggleTarget(id: string, checked: boolean) {
    if (visibility === "specific") {
      setTargetIds(checked ? [id] : []);
    } else {
      setTargetIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
    }
  }

  return (
    <div className="p-4">
      <form action={action} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Notice type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allowedTypes.map((t) => {
                const meta = NOTICE_TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickType(t)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border border-border px-2 py-3 text-xs font-medium text-muted-foreground transition-colors",
                      type === t && "border-primary bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="type" value={type ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notice-title">Title</Label>
            <Input id="notice-title" name="title" required placeholder="e.g. Water supply interruption, 2–4 PM" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notice-desc">Description</Label>
            <Textarea id="notice-desc" name="description" placeholder="Keep it scannable — one idea, plainly stated." />
          </div>

          {type === "meal" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meal-lunch">Lunch</Label>
                <Input id="meal-lunch" name="meal_lunch" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meal-dinner">Dinner</Label>
                <Input id="meal-dinner" name="meal_dinner" />
              </div>
            </div>
          )}

          {type === "utility" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due-amount">Due amount (BDT)</Label>
                <Input id="due-amount" name="due_amount" type="number" step="0.01" min="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due-date">Due date</Label>
                <Input id="due-date" name="due_date" type="date" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select name="priority" defaultValue="normal">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Visibility</Label>
            <div className="flex flex-wrap gap-2">
              {targetOptions.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => pickVisibility(v)}
                  className={cn(
                    "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors",
                    visibility === v && "border-primary bg-accent text-accent-foreground"
                  )}
                >
                  {VISIBILITY_LABEL[v]}
                </button>
              ))}
              {!type && <p className="text-xs text-muted-foreground">Pick a notice type first.</p>}
            </div>
            <input type="hidden" name="visibility" value={visibility ?? ""} />
          </div>

          {needsTargets && (
            <div className="flex flex-col gap-1.5">
              <Label>Target members</Label>
              <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-border p-2.5">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={targetIds.includes(m.id)}
                      onCheckedChange={(c) => toggleTarget(m.id, c === true)}
                    />
                    {getDisplayName(m)}
                  </label>
                ))}
              </div>
              {targetIds.map((id) => (
                <input key={id} type="hidden" name="target_member_ids" value={id} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="pin-toggle" className="mb-0">
              Pin to dashboard
            </Label>
            <Checkbox
              id="pin-toggle"
              checked={isPinned}
              onCheckedChange={(c) => setIsPinned(c === true)}
            />
          </div>
          <input type="hidden" name="is_pinned" value={isPinned ? "on" : ""} />

          {profile.role === "super_admin" && (
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label htmlFor="anon-toggle" className="mb-0">
                  Post as &quot;Cottage&quot;
                </Label>
                <p className="text-xs text-muted-foreground">Hides your name — members see it as a house announcement.</p>
              </div>
              <Checkbox
                id="anon-toggle"
                checked={isAnonymous}
                onCheckedChange={(c) => setIsAnonymous(c === true)}
              />
            </div>
          )}
          <input type="hidden" name="is_anonymous" value={isAnonymous ? "on" : ""} />

          {isPinned && (
            <div className="flex flex-col gap-1.5">
              <Label>Pin duration</Label>
              <Select name="pin_duration" value={pinDuration} onValueChange={(v) => setPinDuration((v as PinDuration) ?? "until_manual")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PIN_DURATIONS.filter((d) => d !== "none").map((d) => (
                    <SelectItem key={d} value={d}>
                      {PIN_DURATION_LABEL[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pinDuration === "until_date" && (
                <Input name="pin_until_date" type="date" required />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="publish-date">Publish date</Label>
              <Input id="publish-date" type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="publish-time">Publish time</Label>
              <Input id="publish-time" type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expire-date">Expire date</Label>
              <Input id="expire-date" type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expire-time">Expire time</Label>
              <Input id="expire-time" type="time" value={expireTime} onChange={(e) => setExpireTime(e.target.value)} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Leave publish blank to post immediately. Leave expire blank to expire in 7 days. Times use your device's local timezone.</p>
          <input type="hidden" name="publish_at" value={publishAtIso} />
          <input type="hidden" name="expires_at" value={expiresAtIso} />
          {(publishDate && !publishAtIso) || (expireDate && !expiresAtIso) ? (
            <p className="text-sm text-destructive">That date/time isn&apos;t valid.</p>
          ) : null}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending || !type || !visibility} className="self-start">
            {pending ? "Publishing…" : "Publish notice"}
          </Button>
      </form>
    </div>
  );
}
