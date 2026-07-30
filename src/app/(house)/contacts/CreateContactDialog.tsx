"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, Contact } from "lucide-react";
import { addContact } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CreateContactDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addContact, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Create Contact
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Contact className="size-4" />Create Contact</DialogTitle>
          </DialogHeader>
          <form action={action} className="flex flex-col gap-4 p-4 pt-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" name="name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-level">Level</Label>
                <Input id="contact-level" name="level" placeholder="e.g. Landlord, Electrician" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-mobile">Mobile number</Label>
                <Input id="contact-mobile" name="mobile_number" placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-email">Email</Label>
                <Input id="contact-email" name="email" type="email" placeholder="Optional" />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" disabled={pending} className="self-start">
                {pending ? "Saving…" : "Save contact"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
