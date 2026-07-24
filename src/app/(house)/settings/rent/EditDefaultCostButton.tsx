"use client";

import { Pencil } from "lucide-react";
import { DefaultCostForm } from "./DefaultCostForm";
import { Button } from "@/components/ui/button";

type Member = { id: string; first_name: string; last_name: string | null };

export function EditDefaultCostButton({
  members,
  category,
  amounts,
}: {
  members: Member[];
  category: string;
  amounts: Record<string, number>;
}) {
  return (
    <DefaultCostForm
      members={members}
      editing={{ category, amounts }}
      trigger={(open) => (
        <Button size="sm" variant="outline" onClick={open}>
          <Pencil />
          Edit
        </Button>
      )}
    />
  );
}
