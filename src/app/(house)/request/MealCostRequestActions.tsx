"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveMealCostRequest, rejectMealCostRequest } from "./actions";

export function MealCostRequestActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => approveMealCostRequest(requestId))}
      >
        <Check />
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(() => rejectMealCostRequest(requestId))}
        className="text-destructive hover:text-destructive"
      >
        <X />
        Reject
      </Button>
    </div>
  );
}
