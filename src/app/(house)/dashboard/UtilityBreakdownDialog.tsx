"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ShareInvoiceButton } from "./ShareInvoiceButton";

type Line = { id: string; label: string; amount: number };
export type CarryInLine = { id: string; label: string; amount: number };

export type InvoiceMeta = {
  memberName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  monthLabel: string;
};

export function UtilityBreakdownDialog({
  lines,
  carryInLines,
  assignedCost,
  paid,
  due,
  invoiceMeta,
  adjustmentLines,
  depositLines,
}: {
  lines: Line[];
  carryInLines: CarryInLine[];
  assignedCost: number;
  paid: number;
  due: number;
  invoiceMeta: InvoiceMeta;
  adjustmentLines: { date: string; label: string; amount: number }[];
  depositLines: { date: string; note: string | null; amount: number }[];
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const body = (
    <div className="flex flex-col gap-3 p-4 pt-2 text-sm">
      {!!carryInLines.length && (
        <div className="flex flex-col gap-1.5 border-b pb-2">
          {carryInLines.map((c) => (
            <div key={c.id} className="flex justify-between">
              <span className="text-muted-foreground">{c.label}</span>
              <span className={cn("font-medium", c.amount >= 0 ? "text-destructive" : "text-emerald-600")}>
                {c.amount >= 0 ? "+" : "−"}
                {Math.abs(c.amount).toFixed(2)} tk
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {lines.map((l) => (
          <div key={l.id} className="flex justify-between">
            <span className="text-muted-foreground">{l.label}</span>
            <span className={cn("font-medium", l.amount >= 0 ? "text-destructive" : "text-emerald-600")}>
              {l.amount >= 0 ? "+" : "−"}
              {Math.abs(l.amount).toFixed(2)} tk
            </span>
          </div>
        ))}
        {!lines.length && <p className="text-muted-foreground">No utility costs yet this month.</p>}
      </div>

      <div className="flex flex-col gap-1 border-t pt-2">
        <div className="flex justify-between font-semibold text-foreground">
          <span>Assigned Cost</span>
          <span>{assignedCost.toFixed(2)} tk</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Paid</span>
          <span>{paid.toFixed(2)} tk</span>
        </div>
        <div
          className={cn(
            "flex justify-between text-base font-semibold",
            due < 0 ? "text-emerald-600" : "text-destructive"
          )}
        >
          <span>{due < 0 ? "Advance Balance" : "Remaining Due"}</span>
          <span>{Math.abs(due).toFixed(2)} tk</span>
        </div>
      </div>

      <div className="flex justify-end border-t pt-3">
        <ShareInvoiceButton
          invoice={{
            ...invoiceMeta,
            carryInLines: carryInLines.map((c) => ({ label: c.label, amount: c.amount })),
            adjustmentLines,
            depositLines,
            assignedCost,
            paid,
            due,
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        See details
        <ChevronRight className="size-3.5" />
      </button>
      {/* Drawer is a mobile-only pattern (Rento); desktop keeps the
       * centered dialog -- this trigger is reachable from both. */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><Zap className="size-4" />Your Utility Breakdown</SheetTitle>
            </SheetHeader>
            {body}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Zap className="size-4" />Your Utility Breakdown</DialogTitle>
            </DialogHeader>
            {body}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
