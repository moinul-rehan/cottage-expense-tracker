"use client";

import { useState } from "react";
import { Plus } from "@/components/animate-ui/icons/plus";
import { Pin } from "@/components/animate-ui/icons/pin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateNoticeForm } from "./CreateNoticeForm";

type Member = { id: string; first_name: string; last_name: string | null };

export function CreateNoticeDialog({
  profile,
  members,
}: {
  profile: { id: string; role: "super_admin" | "member"; can_add_notice: boolean };
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  // Bumping this remounts CreateNoticeForm from scratch after a successful
  // publish, so its internal state (type, visibility, targets, dates…)
  // resets without hand-rolling a reset for every field.
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" />
        Create Notice
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setFormKey((k) => k + 1);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2"><Pin className="size-4" />Create notice</DialogTitle>
          </DialogHeader>
          <CreateNoticeForm
            key={formKey}
            profile={profile}
            members={members}
            onSuccess={() => {
              setOpen(false);
              setFormKey((k) => k + 1);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
