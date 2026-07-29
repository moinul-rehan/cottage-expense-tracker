"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { transferOwnership, requestCottageDeletion, cancelCottageDeletion } from "./actions";
import { ConfirmPasswordDialog } from "@/components/ConfirmPasswordDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDisplayName } from "@/lib/data/display-name";
import { formatDate } from "@/lib/format-date";

type Member = { id: string; first_name: string; last_name: string | null };

export function TransferOwnershipCard({ members }: { members: Member[] }) {
  const [selectedId, setSelectedId] = useState("");
  const selectedMember = members.find((m) => m.id === selectedId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Transfer Ownership</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Hand over super admin access to another member. You&apos;ll become a regular member; they&apos;ll get
          full admin access immediately.
        </p>
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a member…" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {getDisplayName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!members.length && <p className="text-xs text-muted-foreground">No other active members to transfer to.</p>}
        <ConfirmPasswordDialog
          title="Transfer Cottage ownership"
          warning={
            selectedMember
              ? `${getDisplayName(selectedMember)} will become the super admin. You will be downgraded to a regular member. This takes effect immediately.`
              : "Select a member above first."
          }
          confirmLabel="Transfer ownership"
          action={transferOwnership}
          hiddenFields={{ new_super_admin_id: selectedId }}
          renderTrigger={(open) => (
            <Button variant="outline" disabled={!selectedId} onClick={open} className="self-start">
              Transfer ownership
            </Button>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function DeleteCottageCard({ cottageName }: { cottageName: string }) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          Danger zone
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Schedules {cottageName} for permanent deletion in 7 days. Every member is notified immediately (dashboard
          notice + email). You can cancel any time before the 7 days are up.
        </p>
        <ConfirmPasswordDialog
          title="Delete this Cottage"
          warning={`${cottageName} and all its data (expenses, meals, notices, everything) will be permanently deleted in 7 days unless you cancel it before then.`}
          confirmLabel="Schedule deletion"
          action={requestCottageDeletion}
          renderTrigger={(open) => (
            <Button variant="destructive" onClick={open} className="self-start">
              Delete Cottage
            </Button>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function PendingDeletionBanner({
  cottageName,
  deletionDate,
}: {
  cottageName: string;
  deletionDate: string;
}) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Deletion scheduled</p>
            <p className="text-sm text-muted-foreground">
              {cottageName} will be permanently deleted on <strong>{formatDate(deletionDate)}</strong>. All data will
              be erased at that time.
            </p>
          </div>
        </div>
        <ConfirmPasswordDialog
          title="Cancel Cottage deletion"
          warning={`This cancels the scheduled deletion of ${cottageName}. Nothing will be deleted.`}
          confirmLabel="Cancel deletion"
          action={cancelCottageDeletion}
          renderTrigger={(open) => (
            <Button variant="outline" onClick={open} className="self-start">
              Cancel deletion
            </Button>
          )}
        />
      </CardContent>
    </Card>
  );
}
