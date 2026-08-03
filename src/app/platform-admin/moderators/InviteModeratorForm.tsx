"use client";

import { useActionState } from "react";
import { inviteModerator } from "./actions";
import { AdminCard, AdminButton, AdminInput } from "../AdminUI";

export function InviteModeratorForm() {
  const [state, action, pending] = useActionState(inviteModerator, undefined);

  return (
    <AdminCard className="max-w-lg">
      <form action={action} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="moderator-email">
          Invite a moderator
        </label>
        <div className="flex gap-2">
          <AdminInput id="moderator-email" name="email" type="email" required placeholder="name@example.com" />
          <AdminButton type="submit" disabled={pending} className="shrink-0">
            {pending ? "Inviting…" : "Invite"}
          </AdminButton>
        </div>
        <p className="text-xs text-black/40 dark:text-white/40">
          If they don't already have an account, they'll get an email to set a password. If they do, they can sign
          in to /platform-admin/login right away.
        </p>
        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.success}</p>}
      </form>
    </AdminCard>
  );
}
