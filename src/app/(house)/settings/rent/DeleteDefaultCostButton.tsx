"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteDefaultCostCategory } from "./actions";

export function DeleteDefaultCostButton({ category }: { category: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteDefaultCostCategory(category))}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Delete default cost"
    >
      <X className="size-3.5" />
    </button>
  );
}
