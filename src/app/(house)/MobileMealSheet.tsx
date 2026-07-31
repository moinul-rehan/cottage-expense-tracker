"use client";

import { useState } from "react";
import { CalendarDays, Wallet, ShoppingBasket } from "lucide-react";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Send } from "@/components/animate-ui/icons/send";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SpeedDialMenu, type SpeedDialItem, type SpeedDialOrigin } from "./SpeedDialMenu";
import { DailyMealForm } from "./meal/DailyMealForm";
import { DepositForm } from "./meal/DepositForm";
import { BazaarForm } from "./meal/BazaarForm";
import { RequestMealForm } from "./meal/RequestMealForm";
import { RequestMealCostForm } from "./meal/RequestMealCostForm";

type Member = { id: string; first_name: string; last_name: string | null };

/** Bottom-nav "Meal" destination on mobile - a speed-dial pop-out listing
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
  const [dialog, setDialog] = useState<"meal" | "deposit" | "bazaar" | "request" | "cost-request" | null>(null);

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
            label: "Add Meal Expense",
            icon: ShoppingBasket,
            colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            onClick: () => openDialog("bazaar"),
          },
        ]
      : [
          {
            key: "request-cost",
            label: "Request Meal Cost",
            icon: Send,
            colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            onClick: () => openDialog("cost-request"),
          },
        ]),
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
      : [
          {
            key: "request-meal",
            label: "Request Meal",
            icon: Send,
            colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
            onClick: () => openDialog("request"),
          },
        ]),
  ];

  return (
    <>
      <SpeedDialMenu open={open} onClose={() => onOpenChange(false)} items={items} align="center" origin={origin} />

      <Sheet open={dialog === "meal"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Plus className="size-4" />Add Meal</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <DailyMealForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={dialog === "deposit"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Wallet className="size-4" />Add Meal Deposit</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <DepositForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={dialog === "bazaar"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><ShoppingBasket className="size-4" />Add Meal Expense</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <BazaarForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={dialog === "request"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Send className="size-4" />Request Meal</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <RequestMealForm defaultDate={defaultDate} onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={dialog === "cost-request"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Send className="size-4" />Request Meal Cost</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <RequestMealCostForm defaultDate={defaultDate} onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
