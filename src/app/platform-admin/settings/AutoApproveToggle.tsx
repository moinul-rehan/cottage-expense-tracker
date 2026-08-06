"use client";

import { useState, useTransition } from "react";
import { AdminCard, AdminSwitch } from "../AdminUI";
import { setAutoApproveCottages } from "./actions";

export function AutoApproveToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  return (
    <AdminCard className="max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Auto-approve new Cottages</h3>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            When on, a new Cottage created via signup is approved immediately and its members can sign in
            right away - no manual review on the Cottages page. When off (default), every new Cottage stays
            "pending" until an owner or moderator approves it.
          </p>
        </div>
        <AdminSwitch
          checked={enabled}
          disabled={pending}
          onCheckedChange={(next) => {
            setEnabled(next);
            startTransition(() => setAutoApproveCottages(next));
          }}
        />
      </div>
    </AdminCard>
  );
}
