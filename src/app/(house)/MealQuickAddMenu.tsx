"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Wallet, ShoppingBasket, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";
import { BazaarForm } from "./meal/BazaarForm";
import { DailyMealForm } from "./meal/DailyMealForm";
import { DepositForm } from "./meal/DepositForm";

type Member = { id: string; first_name: string; last_name: string | null };

export function MealQuickAddMenu({
  members,
  defaultDate,
  canAddBazaar,
  canAddMeals,
  canAddDeposit,
}: {
  members: Member[];
  defaultDate: string;
  canAddBazaar: boolean;
  canAddMeals: boolean;
  canAddDeposit: boolean;
}) {
  const [open, setOpen] = useState<"meal" | "deposit" | "bazaar" | null>(null);
  const { setOpenMobile } = useSidebar();

  function openDialog(dialog: "meal" | "deposit" | "bazaar") {
    setOpenMobile(false);
    setOpen(dialog);
  }

  return (
    <SidebarMenuSub>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton render={<Link href="/meal/month-details" onClick={() => setOpenMobile(false)} />}>
          <CalendarDays />
          Month Details
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
      {canAddMeals && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => openDialog("meal")}>
            <Plus />
            Add Meal
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      {canAddDeposit && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => openDialog("deposit")}>
            <Wallet />
            Add Meal Deposit
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}
      {canAddBazaar && (
        <SidebarMenuSubItem>
          <SidebarMenuSubButton onClick={() => openDialog("bazaar")}>
            <ShoppingBasket />
            Add Meal Cost
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      )}

      <Dialog open={open === "meal"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DailyMealForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "deposit"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Deposit</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <DepositForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "bazaar"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Cost</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <BazaarForm members={members} defaultDate={defaultDate} hideCard onSuccess={() => setOpen(null)} />
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenuSub>
  );
}
