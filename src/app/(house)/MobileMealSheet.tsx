"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Plus, Wallet, ShoppingBasket } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SheetActionRow } from "./SheetActionRow";
import { DailyMealForm } from "./meal/DailyMealForm";
import { DepositForm } from "./meal/DepositForm";
import { BazaarForm } from "./meal/BazaarForm";

type Member = { id: string; first_name: string; last_name: string | null };

/** Bottom-nav "Meal" destination on mobile — a bottom sheet listing Month
 * Details plus whichever quick-add actions this member can use, mirroring
 * MealQuickAddMenu's sidebar entry but as a tappable action sheet. */
export function MobileMealSheet({
  open,
  onOpenChange,
  members,
  defaultDate,
  canAddBazaar,
  canAddMeals,
  canAddDeposit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  defaultDate: string;
  canAddBazaar: boolean;
  canAddMeals: boolean;
  canAddDeposit: boolean;
}) {
  const pathname = usePathname();
  const [dialog, setDialog] = useState<"meal" | "deposit" | "bazaar" | null>(null);

  function openDialog(next: typeof dialog) {
    onOpenChange(false);
    setDialog(next);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl data-[side=bottom]:bottom-[calc(4rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>Meal</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            <SheetActionRow
              icon={CalendarDays}
              label="Month Details"
              href="/meal/month-details"
              active={pathname === "/meal/month-details"}
              onClick={() => onOpenChange(false)}
            />
            {canAddMeals && <SheetActionRow icon={Plus} label="Add Meal" onClick={() => openDialog("meal")} />}
            {canAddDeposit && (
              <SheetActionRow icon={Wallet} label="Add Meal Deposit" onClick={() => openDialog("deposit")} />
            )}
            {canAddBazaar && (
              <SheetActionRow icon={ShoppingBasket} label="Add Meal Cost" onClick={() => openDialog("bazaar")} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={dialog === "meal"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DailyMealForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "deposit"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DepositForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "bazaar"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Cost</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <BazaarForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
