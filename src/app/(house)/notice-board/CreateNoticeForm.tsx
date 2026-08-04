"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createNotice, type CreateNoticeState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormSection } from "@/components/ui/form-section";
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

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function plusDaysLocal(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function previewLocal(ms: number) {
  const d = new Date(ms);
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const allowedTypes = useMemo(() => ALL_TYPES.filter((t) => canCreateNoticeType(profile, t)), [profile]);

  const [type, setType] = useState<NoticeType | null>(null);
  const [visibility, setVisibility] = useState<NoticeVisibility | null>(null);
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [pinDuration, setPinDuration] = useState<PinDuration>("until_manual");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [publishMode, setPublishMode] = useState<"now" | "later">("now");
  const [expireMode, setExpireMode] = useState<"default" | "custom">("default");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("09:00");
  const [expireDate, setExpireDate] = useState("");
  const [expireTime, setExpireTime] = useState("23:59");

  // Built client-side from local <input type="date"/"time"> values - where
  // `new Date(...)` resolves against the visitor's own timezone. Doing this
  // server-side would use the server's timezone instead and silently
  // publish/expire notices at the wrong wall-clock time.
  const publishAtIso = useMemo(() => {
    if (publishMode === "now" || !publishDate) return "";
    const d = new Date(`${publishDate}T${publishTime || "00:00"}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [publishMode, publishDate, publishTime]);
  const expiresAtIso = useMemo(() => {
    if (expireMode === "default" || !expireDate) return "";
    const d = new Date(`${expireDate}T${expireTime || "23:59"}`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }, [expireMode, expireDate, expireTime]);

  // Live preview so the creator can see exactly what will be submitted,
  // in their own local time, before publishing - catches mismatched
  // dates/times immediately instead of discovering them on the board.
  const [nowMs] = useState<number>(() => Date.now());

  const effectivePublishMs = useMemo(
    () => (publishMode === "now" ? nowMs : publishAtIso ? new Date(publishAtIso).getTime() : NaN),
    [publishMode, publishAtIso, nowMs]
  );
  const effectiveExpireMs = useMemo(
    () =>
      expireMode === "custom"
        ? expiresAtIso
          ? new Date(expiresAtIso).getTime()
          : NaN
        : Number.isFinite(effectivePublishMs)
          ? effectivePublishMs + 7 * 24 * 3600 * 1000
          : NaN,
    [expireMode, expiresAtIso, effectivePublishMs]
  );

  if (!allowedTypes.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        You don&apos;t have permission to create notices yet - ask your admin to grant it in Members.
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
    <form action={action} className="flex flex-col">
      <div className="flex max-h-[64dvh] flex-col gap-5 overflow-y-auto overscroll-contain px-4 pt-1 pb-4">
        <FormSection title="Notice type">
          <div className="grid grid-cols-3 gap-2">
            {allowedTypes.map((t) => {
              const meta = NOTICE_TYPE_META[t];
              const Icon = meta.icon;
              const selected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickType(t)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[11px] leading-tight font-medium transition-colors",
                    selected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  <span className={cn("flex size-8 items-center justify-center rounded-full", meta.chip)}>
                    <Icon className="size-4" />
                  </span>
                  {meta.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="type" value={type ?? ""} />
        </FormSection>

        <Separator />

        <FormSection title="Details">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notice-title">Title</Label>
              <Input id="notice-title" name="title" required placeholder="e.g. Water supply interruption, 2–4 PM" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notice-desc">Description</Label>
              <Textarea id="notice-desc" name="description" placeholder="Keep it scannable - one idea, plainly stated." />
            </div>

            {type === "meal" && (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="meal-lunch" className="text-xs text-muted-foreground">Lunch</Label>
                  <Input id="meal-lunch" name="meal_lunch" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="meal-dinner" className="text-xs text-muted-foreground">Dinner</Label>
                  <Input id="meal-dinner" name="meal_dinner" />
                </div>
              </div>
            )}

            {type === "utility" && (
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="due-amount" className="text-xs text-muted-foreground">Due amount (BDT)</Label>
                  <Input id="due-amount" name="due_amount" type="number" step="0.01" min="0" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="due-date" className="text-xs text-muted-foreground">Due date</Label>
                  <Input id="due-date" name="due_date" type="date" />
                </div>
              </div>
            )}
          </div>
        </FormSection>

        <Separator />

        <FormSection title="Priority">
          <div className="grid grid-cols-4 gap-2">
            {ALL_PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "rounded-full py-1.5 text-xs font-bold transition-opacity",
                  PRIORITY_META[p].pill,
                  priority === p ? "opacity-100 ring-2 ring-ring ring-offset-1 ring-offset-popover" : "opacity-45 hover:opacity-75"
                )}
              >
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
          <input type="hidden" name="priority" value={priority} />
        </FormSection>

        <Separator />

        <FormSection title="Audience" hint={!type ? "Pick a notice type first." : undefined}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {targetOptions.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => pickVisibility(v)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    visibility === v
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {VISIBILITY_LABEL[v]}
                </button>
              ))}
            </div>
            <input type="hidden" name="visibility" value={visibility ?? ""} />

            {needsTargets && (
              <div className="flex max-h-36 flex-col gap-2 overflow-y-auto overscroll-contain rounded-lg border border-border p-2.5">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={targetIds.includes(m.id)} onCheckedChange={(c) => toggleTarget(m.id, c === true)} />
                    {getDisplayName(m)}
                  </label>
                ))}
                {targetIds.map((id) => (
                  <input key={id} type="hidden" name="target_member_ids" value={id} />
                ))}
              </div>
            )}
          </div>
        </FormSection>

        <Separator />

        <FormSection title="Schedule">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Publish</span>
              <div className="inline-flex w-fit overflow-hidden rounded-full border border-border p-0.5">
                {(["now", "later"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPublishMode(m);
                      if (m === "later" && !publishDate) setPublishDate(todayLocal());
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      publishMode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "now" ? "Now" : "Schedule for later"}
                  </button>
                ))}
              </div>
              {publishMode === "later" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
                  <Input type="time" value={publishTime} onChange={(e) => setPublishTime(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Expire</span>
              <div className="inline-flex w-fit overflow-hidden rounded-full border border-border p-0.5">
                {(["default", "custom"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setExpireMode(m);
                      if (m === "custom" && !expireDate) setExpireDate(plusDaysLocal(7));
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      expireMode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "default" ? "In 7 days" : "Custom date"}
                  </button>
                ))}
              </div>
              {expireMode === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} />
                  <Input type="time" value={expireTime} onChange={(e) => setExpireTime(e.target.value)} />
                </div>
              )}
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
              {Number.isFinite(effectivePublishMs) && (
                <p>
                  Will publish <b className="text-foreground">{publishMode === "now" ? "immediately" : previewLocal(effectivePublishMs)}</b>
                  {Number.isFinite(effectiveExpireMs) && (
                    <>
                      {" "}
                      and expire <b className="text-foreground">{previewLocal(effectiveExpireMs)}</b>
                    </>
                  )}
                  {" "}
                  - your device&apos;s local time.
                </p>
              )}
            </div>
            <input type="hidden" name="publish_at" value={publishAtIso} />
            <input type="hidden" name="expires_at" value={expiresAtIso} />
            {(publishMode === "later" && publishDate && !publishAtIso) ||
            (expireMode === "custom" && expireDate && !expiresAtIso) ? (
              <p className="text-sm text-destructive">That date/time isn&apos;t valid.</p>
            ) : null}
          </div>
        </FormSection>

        <Separator />

        <FormSection title="Options">
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            <label htmlFor="pin-toggle" className="flex cursor-pointer items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Pin to dashboard</p>
                <p className="text-xs text-muted-foreground">Shows this notice in Pinned Notices for everyone it&apos;s visible to.</p>
              </div>
              <Checkbox id="pin-toggle" checked={isPinned} onCheckedChange={(c) => setIsPinned(c === true)} />
            </label>
            {isPinned && (
              <div className="p-3">
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
                  <Input name="pin_until_date" type="date" required className="mt-2" />
                )}
              </div>
            )}

            {profile.role === "super_admin" && (
              <label htmlFor="anon-toggle" className="flex cursor-pointer items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Post as &quot;Cottage&quot;</p>
                  <p className="text-xs text-muted-foreground">Hides your name - members see it as a house announcement.</p>
                </div>
                <Checkbox id="anon-toggle" checked={isAnonymous} onCheckedChange={(c) => setIsAnonymous(c === true)} />
              </label>
            )}
          </div>
          <input type="hidden" name="is_pinned" value={isPinned ? "on" : ""} />
          <input type="hidden" name="is_anonymous" value={isAnonymous ? "on" : ""} />
        </FormSection>
      </div>

      <div className="flex flex-col gap-2 border-t border-border p-4">
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending || !type || !visibility} className="self-start">
          {pending ? "Publishing…" : "Publish notice"}
        </Button>
      </div>
    </form>
  );
}
