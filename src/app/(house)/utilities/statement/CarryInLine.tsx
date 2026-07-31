"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Lock } from "@/components/animate-ui/icons/lock";
import { Check } from "@/components/animate-ui/icons/check";
import { X } from "@/components/animate-ui/icons/x";
import { updateCarryIn, deleteCarryIn } from "./actions";
import { cn } from "@/lib/utils";

export function CarryInLine({
  id,
  label,
  amount,
}: {
  id: string;
  label: string;
  amount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(Math.abs(amount)));
  const [sign, setSign] = useState<1 | -1>(amount < 0 ? -1 : 1);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          {label}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn("font-medium", amount >= 0 ? "text-destructive" : "text-emerald-600")}>
            {amount >= 0 ? "+" : "−"}
            {Math.abs(amount).toFixed(2)} tk
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Edit carried-over amount"
          >
            <Pencil className="size-3.5" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <select
          value={sign}
          onChange={(e) => setSign(Number(e.target.value) as 1 | -1)}
          className="rounded-md border border-border bg-background px-1.5 py-1 text-xs"
          disabled={pending}
        >
          <option value={1}>+ Due</option>
          <option value={-1}>− Advance</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          className="w-20 rounded-md border border-border bg-background px-1.5 py-1 text-xs"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const amt = Number(value);
              if (Number.isFinite(amt) && amt >= 0) await updateCarryIn(id, amt * sign);
              setEditing(false);
            })
          }
          className="text-emerald-600 hover:text-emerald-700"
          aria-label="Save"
        >
          <Check className="size-4" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => deleteCarryIn(id))}
          className="text-destructive hover:text-destructive/80"
          aria-label="Delete carried-over line"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
