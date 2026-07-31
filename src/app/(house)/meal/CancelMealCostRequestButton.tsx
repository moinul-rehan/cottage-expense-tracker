"use client";

import { useTransition } from "react";
import { X } from "@/components/animate-ui/icons/x";
import { cancelMealCostRequest } from "./cost-request-actions";

export function CancelMealCostRequestButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => cancelMealCostRequest(requestId))}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Cancel request"
    >
      <X className="size-3.5" />
    </button>
  );
}
