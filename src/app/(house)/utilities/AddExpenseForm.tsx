"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addExpense } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { FormSection } from "@/components/ui/form-section";
import { getDisplayName } from "@/lib/data/display-name";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

type Member = { id: string; first_name: string; last_name: string | null };

const CATEGORY_OPTIONS = Object.entries(UTILITY_CATEGORY_LABELS).filter(([value]) => value !== "other");

export function AddExpenseForm({
  members,
  defaultDate,
  onSuccess,
  hideCard = false,
}: {
  members: Member[];
  defaultDate: string;
  onSuccess?: () => void;
  hideCard?: boolean;
}) {
  const [state, action, pending] = useActionState(addExpense, undefined);
  const [category, setCategory] = useState("electricity");
  const [paymentSource, setPaymentSource] = useState<"member" | "cottage_balance" | "none">("cottage_balance");
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onSuccess?.();
    }
    wasPending.current = pending;
  }, [pending, state, onSuccess]);

  const form = (
        <form action={action} className="flex flex-col gap-5">
          <FormSection title="Expense">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select name="category" value={category} onValueChange={(v) => setCategory(v ?? "electricity")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {category === "other" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="exp-custom-category">Custom Category Name</Label>
                  <Input id="exp-custom-category" name="custom_category" required placeholder="e.g. Gas cylinder" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="exp-amount">Amount</Label>
                <Input id="exp-amount" name="amount" type="number" step="0.01" min="0.01" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="exp-date">Date</Label>
                <Input id="exp-date" name="expense_date" type="date" defaultValue={defaultDate} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="exp-description">Description</Label>
                <Textarea id="exp-description" name="description" placeholder="Optional" />
              </div>
            </div>
          </FormSection>

          <Separator />

          <FormSection title="Payment Source">
            <div className="flex flex-col gap-1.5">
              <RadioGroup
                name="payment_source"
                value={paymentSource}
                className="flex flex-row flex-wrap gap-6"
                onValueChange={(v) => setPaymentSource((v as typeof paymentSource) ?? "cottage_balance")}
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="member" /> Member
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="cottage_balance" /> Cottage Balance
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="none" /> None
                </label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                {paymentSource === "member" &&
                  "That member already paid the vendor directly - reduces their Utility Due. Cottage Balance is unaffected."}
                {paymentSource === "cottage_balance" && "Paid from the shared fund - Cottage Balance decreases by this amount."}
                {paymentSource === "none" && "Recorded only. No balance or due changes."}
              </p>
            </div>

            {paymentSource === "member" && (
              <div className="flex flex-col gap-1.5 sm:w-64">
                <Label>Which member paid</Label>
                <Select name="paid_by_member" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select…">
                      {(value: string | null) => {
                        const member = members.find((m) => m.id === value);
                        return member ? getDisplayName(member) : "Select…";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {getDisplayName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </FormSection>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Saving…" : "Add Expense"}
            </Button>
          </div>
        </form>
  );

  if (hideCard) return form;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add Utility Expense</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
