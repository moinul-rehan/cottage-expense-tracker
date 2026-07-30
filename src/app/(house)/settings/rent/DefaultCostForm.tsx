"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { Plus, Banknote } from "lucide-react";
import { saveDefaultCost } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FormSection } from "@/components/ui/form-section";
import { getDisplayName } from "@/lib/data/display-name";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

type Member = { id: string; first_name: string; last_name: string | null };

const CATEGORY_OPTIONS = Object.entries(UTILITY_CATEGORY_LABELS).filter(([value]) => value !== "other");

export function DefaultCostForm({
  members,
  editing,
  trigger,
}: {
  members: Member[];
  /** Pass to edit an existing category: locks the category picker and pre-fills each member's amount. */
  editing?: { category: string; amounts: Record<string, number> };
  trigger?: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveDefaultCost, undefined);
  const [category, setCategory] = useState(editing?.category ?? CATEGORY_OPTIONS[0]?.[0] ?? "electricity");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add Default Cost
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="size-4" />
              {editing ? "Edit Default Cost" : "Add Default Cost"}
            </DialogTitle>
          </DialogHeader>
          <form action={action} className="flex flex-col">
            <div className="flex flex-col gap-5 px-4 pt-1 pb-4">
              <input type="hidden" name="member_ids" value={members.map((m) => m.id).join(",")} />

              <FormSection title="Category">
                {editing ? (
                  <>
                    <input type="hidden" name="category" value={category} />
                    <p className="rounded-md border px-3 py-2 text-sm text-foreground">
                      {UTILITY_CATEGORY_LABELS[category] ?? category}
                    </p>
                  </>
                ) : (
                  <Select name="category" value={category} onValueChange={(v) => setCategory(v ?? category)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormSection>

              <Separator />

              <FormSection title="Split among members">
                <div className="flex flex-col gap-3">
                  {members.map((m) => (
                    <div key={m.id} className="grid grid-cols-2 items-center gap-3">
                      <span className="text-sm text-foreground">{getDisplayName(m)}</span>
                      <Input
                        name={`amount_${m.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        defaultValue={editing?.amounts[m.id] ?? ""}
                      />
                    </div>
                  ))}
                  {!members.length && (
                    <p className="text-sm text-muted-foreground">No active members yet.</p>
                  )}
                </div>
              </FormSection>
            </div>

            <div className="flex flex-col gap-2 border-t border-border p-4">
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" disabled={pending || !members.length} className="self-start">
                {pending ? "Saving…" : "Save default cost"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
