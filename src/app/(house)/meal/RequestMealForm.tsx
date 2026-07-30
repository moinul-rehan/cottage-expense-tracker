"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitMealRequest } from "./request-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RequestMealForm({ defaultDate, onSuccess }: { defaultDate: string; onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(submitMealRequest, undefined);
  const wasPending = useRef(false);
  const today = todayLocal();

  useEffect(() => {
    if (wasPending.current && !pending && state?.success) {
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request_date">Date</Label>
        <Input
          id="request_date"
          name="request_date"
          type="date"
          min={today}
          defaultValue={defaultDate < today ? today : defaultDate}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lunch">Lunch</Label>
          <Input id="lunch" name="lunch" type="number" step="0.5" min="0" defaultValue="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dinner">Dinner</Label>
          <Input id="dinner" name="dinner" type="number" step="0.5" min="0" defaultValue="0" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Submitting…" : "Request meal"}
      </Button>
    </form>
  );
}
