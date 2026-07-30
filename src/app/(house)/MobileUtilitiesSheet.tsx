"use client";

import { useState } from "react";
import { ListTree, FileText, Wallet, HandCoins, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

      <Dialog open={dialog === "member-deposit"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Utility Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <MemberDepositForm members={members} defaultDate={defaultDate} onSuccess={() => setDialog(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "cottage-deposit"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cottage Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <CottageDepositForm defaultDate={defaultDate} onSuccess={() => setDialog(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "expense"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Utility Expense</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <AddExpenseForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setDialog(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
