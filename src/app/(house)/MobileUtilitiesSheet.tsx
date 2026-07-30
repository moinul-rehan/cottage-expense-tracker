"use client";

import { useState } from "react";
import { ListTree, FileText, Wallet, HandCoins, Receipt } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SpeedDialMenu, type SpeedDialItem, type SpeedDialOrigin } from "./SpeedDialMenu";
import { MemberDepositForm } from "./utilities/MemberDepositForm";
import { CottageDepositForm } from "./utilities/CottageDepositForm";
import { AddExpenseForm } from "./utilities/AddExpenseForm";

type Member = { id: string; first_name: string; last_name: string | null };

/** Bottom-nav "Utilities" destination on mobile - mirrors
 * UtilitiesQuickAddMenu's sidebar entry as a speed-dial pop-out. */
export function MobileUtilitiesSheet({
  open,
  onOpenChange,
  origin,
  members,
  defaultDate,
  isSuperAdmin,
  canAddExpenses,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: SpeedDialOrigin | null;
  members: Member[];
  defaultDate: string;
  isSuperAdmin: boolean;
  canAddExpenses: boolean;
}) {
  const [dialog, setDialog] = useState<"member-deposit" | "cottage-deposit" | "expense" | null>(null);

  function openDialog(next: typeof dialog) {
    onOpenChange(false);
    setDialog(next);
  }

  const items: SpeedDialItem[] = [
    {
      key: "utility-details",
      href: "/utilities/history",
      label: "Utility Details",
      icon: ListTree,
      colorClass: "bg-accent text-accent-foreground",
    },
    ...(isSuperAdmin
      ? [
          {
            key: "cottage-deposit",
            label: "Cottage Deposit",
            icon: HandCoins,
            colorClass: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
            onClick: () => openDialog("cottage-deposit"),
          },
          {
            key: "member-deposit",
            label: "Member Deposit",
            icon: Wallet,
            colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            onClick: () => openDialog("member-deposit"),
          },
          {
            key: "utility-statements",
            href: "/utilities/statement",
            label: "Utility Statements",
            icon: FileText,
            colorClass: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
          },
        ]
      : []),
    ...(canAddExpenses
      ? [
          {
            key: "utility-expense",
            label: "Utility Expense",
            icon: Receipt,
            colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            onClick: () => openDialog("expense"),
          },
        ]
      : []),
  ];

  return (
    <>
      <SpeedDialMenu open={open} onClose={() => onOpenChange(false)} items={items} align="end" origin={origin} />

      <Sheet open={dialog === "member-deposit"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle>Member Utility Deposit</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <MemberDepositForm members={members} defaultDate={defaultDate} onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={dialog === "cottage-deposit"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle>Cottage Deposit</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <CottageDepositForm defaultDate={defaultDate} onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={dialog === "expense"} onOpenChange={(v) => !v && setDialog(null)}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[24px]">
          <SheetHeader>
            <SheetTitle>Utility Expense</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-2">
            <AddExpenseForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
