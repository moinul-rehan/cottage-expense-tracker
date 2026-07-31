"use client";

import { useActionState, useState, useTransition } from "react";
import {
  approveCottage,
  rejectCottage,
  updateCottagePlan,
  updateCottageSubscriptionStatus,
  suspendCottage,
  reactivateCottage,
  deleteCottage,
} from "./actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminButton, AdminCard, AdminCardTitle, AdminInput } from "../../AdminUI";

const PLANS = ["free", "paid"];
const STATUSES = ["active", "past_due", "canceled"];

export function PlanAndStatusControls({
  cottageId,
  plan,
  subscriptionStatus,
}: {
  cottageId: string;
  plan: string;
  subscriptionStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AdminCard className="flex flex-col gap-3">
      <AdminCardTitle>Plan & billing</AdminCardTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Plan</Label>
          <Select
            value={plan}
            disabled={pending}
            onValueChange={(v) => v && startTransition(() => updateCottagePlan(cottageId, v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Subscription status</Label>
          <Select
            value={subscriptionStatus}
            disabled={pending}
            onValueChange={(v) => v && startTransition(() => updateCottageSubscriptionStatus(cottageId, v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </AdminCard>
  );
}

export function ApprovalControls({ cottageId }: { cottageId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <AdminCard className="flex flex-col gap-3 border-amber-400/40 bg-amber-50 dark:bg-amber-950/20">
        <AdminCardTitle>Reject Cottage</AdminCardTitle>
        <Label htmlFor="reject-reason">Reason (emailed to the super admin)</Label>
        <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
        <div className="flex gap-2">
          <AdminButton
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => rejectCottage(cottageId, reason))}
          >
            {pending ? "Rejecting…" : "Confirm reject"}
          </AdminButton>
          <AdminButton variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
            Cancel
          </AdminButton>
        </div>
      </AdminCard>
    );
  }

  return (
    <AdminCard className="flex flex-col gap-3 border-amber-400/40 bg-amber-50 dark:bg-amber-950/20">
      <AdminCardTitle>Pending approval</AdminCardTitle>
      <p className="text-sm text-black/60 dark:text-white/60">
        This Cottage was just created and is waiting for review. Members can&apos;t sign in until it&apos;s approved.
        The super admin will get an email either way.
      </p>
      <div className="flex gap-2">
        <AdminButton disabled={pending} onClick={() => startTransition(() => approveCottage(cottageId))}>
          {pending ? "Approving…" : "Approve Cottage"}
        </AdminButton>
        <AdminButton variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
          Reject Cottage
        </AdminButton>
      </div>
    </AdminCard>
  );
}

export function SuspendControls({ cottageId, suspended }: { cottageId: string; suspended: boolean }) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);

  if (suspended) {
    return (
      <AdminButton
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(() => reactivateCottage(cottageId))}
        className="self-start"
      >
        {pending ? "Reactivating…" : "Reactivate Cottage"}
      </AdminButton>
    );
  }

  if (!showReason) {
    return (
      <AdminButton variant="outline" onClick={() => setShowReason(true)} className="self-start">
        Suspend Cottage
      </AdminButton>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="suspend-reason">Reason (shown to members)</Label>
      <Textarea id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
      <div className="flex gap-2">
        <AdminButton
          variant="destructive"
          disabled={pending}
          onClick={() => startTransition(() => suspendCottage(cottageId, reason))}
        >
          {pending ? "Suspending…" : "Confirm suspend"}
        </AdminButton>
        <AdminButton variant="ghost" onClick={() => setShowReason(false)}>
          Cancel
        </AdminButton>
      </div>
    </div>
  );
}

export function DeleteCottageForm({ cottageId, cottageName }: { cottageId: string; cottageName: string }) {
  const [state, action, pending] = useActionState(deleteCottage, undefined);
  const [confirmName, setConfirmName] = useState("");

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="cottage_id" value={cottageId} />
      <Label htmlFor="confirm-name">
        Type <span className="font-semibold">{cottageName}</span> to confirm deletion
      </Label>
      <AdminInput
        id="confirm-name"
        name="confirm_name"
        value={confirmName}
        onChange={(e) => setConfirmName(e.target.value)}
        autoComplete="off"
        className="max-w-sm"
      />
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <AdminButton
        type="submit"
        variant="destructive"
        disabled={pending || confirmName !== cottageName}
        className="self-start"
      >
        {pending ? "Deleting…" : "Permanently delete Cottage"}
      </AdminButton>
    </form>
  );
}
