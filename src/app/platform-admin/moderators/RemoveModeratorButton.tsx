"use client";

import { useTransition } from "react";
import { removeModerator } from "./actions";
import { AdminButton } from "../AdminUI";

export function RemoveModeratorButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <AdminButton
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Remove ${email} as a platform moderator?`)) return;
        startTransition(() => removeModerator(id));
      }}
    >
      {pending ? "Removing…" : "Remove"}
    </AdminButton>
  );
}
