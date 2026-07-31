"use client";

import { useTransition } from "react";
import { X } from "@/components/animate-ui/icons/x";
import { deleteUtilityAdjustment } from "./actions";

export function DeleteAdjustmentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteUtilityAdjustment(id))}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Delete adjustment"
    >
      <X className="size-3.5" />
    </button>
  );
}
