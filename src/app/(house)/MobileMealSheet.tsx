"use client";

import { useState } from "react";
import { CalendarDays, Plus, Wallet, ShoppingBasket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpeedDialMenu, type SpeedDialItem, type SpeedDialOrigin } from "./SpeedDialMenu";
import { DailyMealForm } from "./meal/DailyMealForm";
import { DepositForm } from "./meal/DepositForm";
import { BazaarForm } from "./meal/BazaarForm";

type Member = { id: string; first_name: string; last_name: string | null };

/** Bottom-nav "Meal" destination on mobile — a speed-dial pop-out listing
 * Month Details plus whichever quick-add actions this member can use,
 * mirroring MealQuickAddMenu's sidebar entry. */
export function MobileMealSheet({
  open,
  onOpenChange,
  origin,
  members,
  defaultDate,
  canAddBazaar,
  canAddMeals,
  canAddDeposit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: SpeedDialOrigin | null;
  members: Member[];
  defaultDate: string;
  canAddBazaar: boolean;
  canAddMeals: boolean;
  canAddDeposit: boolean;
}) {
  const [dialog, setDialog] = useState<"meal" | "deposit" | "bazaar" | null>(null);

  function openDialog(next: typeof dialog) {
    onOpenChange(false);
    setDialog(next);
  }

  const items: SpeedDialItem[] = [
    {
      key: "month-details",
      href: "/meal/month-details",
      label: "Month Details",
      icon: CalendarDays,
      colorClass: "bg-accent text-accent-foreground",
    },
    ...(canAddBazaar
      ? [
          {
            key: "add-cost",
            label: "Add Meal Cost",
            icon: ShoppingBasket,
            colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            onClick: () => openDialog("bazaar"),
          },
        ]
      : []),
    ...(canAddDeposit
      ? [
          {
            key: "add-deposit",
            label: "Add Meal Deposit",
            icon: Wallet,
            colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            onClick: () => openDialog("deposit"),
          },
        ]
      : []),
    ...(canAddMeals
      ? [
          {
            key: "add-meal",
            label: "Add Meal",
            icon: Plus,
            colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
            onClick: () => openDialog("meal"),
          },
        ]
      : []),
  ];

  return (
    <>
      <SpeedDialMenu open={open} onClose={() => onOpenChange(false)} items={items} align="center" origin={origin} />

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
