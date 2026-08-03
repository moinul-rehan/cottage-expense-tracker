"use client";

import { useActionState, useMemo, useState } from "react";
import { getFullName } from "@/lib/data/display-name";
import { sendPlatformNotification } from "./actions";
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect } from "../AdminUI";

type Cottage = { id: string; name: string };
type Member = { id: string; first_name: string; last_name: string | null; cottage_id: string };

const TARGETS = [
  { value: "everyone", label: "Everyone (every Cottage)" },
  { value: "cottage", label: "One Cottage (all members)" },
  { value: "member", label: "A single member" },
] as const;

export function SendNotificationForm({ cottages, members }: { cottages: Cottage[]; members: Member[] }) {
  const [state, action, pending] = useActionState(sendPlatformNotification, undefined);
  const [target, setTarget] = useState<(typeof TARGETS)[number]["value"]>("everyone");
  const [cottageId, setCottageId] = useState(cottages[0]?.id ?? "");

  const cottageMembers = useMemo(
    () => members.filter((m) => m.cottage_id === cottageId),
    [members, cottageId]
  );

  return (
    <AdminCard className="max-w-lg">
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Send to</label>
          <AdminSelect name="target" value={target} onChange={(e) => setTarget(e.target.value as typeof target)}>
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </AdminSelect>
        </div>

        {target === "cottage" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Cottage</label>
            <AdminSelect name="cottage_id" value={cottageId} onChange={(e) => setCottageId(e.target.value)}>
              {cottages.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </AdminSelect>
            {!cottages.length && <p className="text-xs text-black/40 dark:text-white/40">No Cottages yet.</p>}
          </div>
        )}

        {target === "member" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Cottage</label>
            <AdminSelect value={cottageId} onChange={(e) => setCottageId(e.target.value)}>
              {cottages.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </AdminSelect>
            <label className="mt-2 text-sm font-medium">Member</label>
            <AdminSelect name="member_id">
              {cottageMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {getFullName(m) || "Member"}
                </option>
              ))}
            </AdminSelect>
            {!cottageMembers.length && (
              <p className="text-xs text-black/40 dark:text-white/40">No active members in this Cottage.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="notif-title">
            Title
          </label>
          <AdminInput id="notif-title" name="title" required placeholder="e.g. Scheduled maintenance tonight" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="notif-body">
            Message (optional)
          </label>
          <AdminTextarea id="notif-body" name="body" rows={3} placeholder="More detail for the notification body…" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="notif-link">
            Link (optional)
          </label>
          <AdminInput id="notif-link" name="link" placeholder="/dashboard" />
        </div>

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}

        <AdminButton type="submit" disabled={pending} className="self-start">
          {pending ? "Sending…" : "Send notification"}
        </AdminButton>
      </form>
    </AdminCard>
  );
}
