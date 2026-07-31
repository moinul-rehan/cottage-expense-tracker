"use client";

import { useTransition } from "react";
import { Check } from "@/components/animate-ui/icons/check";
import { X } from "@/components/animate-ui/icons/x";
import { Button } from "@/components/ui/button";
import { approveMealRequest, rejectMealRequest } from "./actions";

export function MealRequestActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => approveMealRequest(requestId))}
      >
        <Check />
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(() => rejectMealRequest(requestId))}
        className="text-destructive hover:text-destructive"
      >
        <X />
        Reject
      </Button>
    </div>
  );
}
