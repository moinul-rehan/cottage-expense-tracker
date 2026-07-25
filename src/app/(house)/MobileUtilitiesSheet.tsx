"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ListTree, FileText, Wallet, HandCoins, History } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SheetActionRow } from "./SheetActionRow";
import { MemberDepositForm } from "./utilities/MemberDepositForm";
import { CottageDepositForm } from "./utilities/CottageDepositForm";

type Member = { id: string; first_name: string; last_name: string | null };

/** Bottom-nav "Utilities" destination on mobile — mirrors
 * UtilitiesQuickAddMenu's sidebar entry as a tappable bottom sheet. */
export function MobileUtilitiesSheet({
  open,
  onOpenChange,
  members,
  defaultDate,
  isSuperAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  defaultDate: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const [dialog, setDialog] = useState<"member-deposit" | "cottage-deposit" | null>(null);

  function openDialog(next: typeof dialog) {
    onOpenChange(false);
    setDialog(next);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl data-[side=bottom]:bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>Utilities</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            <SheetActionRow
              icon={ListTree}
              label="Utility Details"
              href="/utilities"
              active={pathname === "/utilities"}
              onClick={() => onOpenChange(false)}
            />
            {isSuperAdmin && (
              <SheetActionRow
                icon={FileText}
                label="Utility Statements"
                href="/utilities/statement"
                active={pathname === "/utilities/statement"}
                onClick={() => onOpenChange(false)}
              />
            )}
            {isSuperAdmin && (
              <SheetActionRow icon={Wallet} label="Member Deposit" onClick={() => openDialog("member-deposit")} />
            )}
            {isSuperAdmin && (
              <SheetActionRow icon={HandCoins} label="Cottage Deposit" onClick={() => openDialog("cottage-deposit")} />
            )}
            <SheetActionRow
              icon={History}
              label="Utility History"
              href="/utilities/history"
              active={pathname === "/utilities/history"}
              onClick={() => onOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  );
}
