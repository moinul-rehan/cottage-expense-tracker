"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import { formatDate } from "@/lib/format-date";

export type MealCostRequestState = { error?: string; success?: string } | undefined;

export async function submitMealCostRequest(
  _prevState: MealCostRequestState,
  formData: FormData
): Promise<MealCostRequestState> {
  const profile = await getCurrentProfile();
  if (profile.role === "super_admin" || profile.can_add_bazaar) {
    return { error: "You can already log meal costs directly - no need to request one." };
  }

  const entryDate = String(formData.get("entry_date") ?? "");
  const amount = Number(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!entryDate) return { error: "Pick a date." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();

  const { error } = await supabase.from("meal_cost_requests").insert({
    cottage_id: profile.cottage_id,
    user_id: profile.id,
    entry_date: entryDate,
    amount,
    description,
  });

  if (error) return { error: "Could not submit the request." };

  const { data: managers } = await supabase
    .from("profiles")
    .select("id")
    .eq("cottage_id", profile.cottage_id)
    .eq("is_active", true)
    .or("role.eq.super_admin,can_add_bazaar.eq.true");

  await notifyUsers(
    supabase,
    profile.cottage_id,
    (managers ?? []).map((m) => m.id).filter((id) => id !== profile.id),
    {
      type: "meal_cost_request_submitted",
      title: "New meal cost request",
      body: `${profile.first_name} requested ${amount.toFixed(2)} tk on ${formatDate(entryDate)}.`,
      link: "/request",
    }
  );

  revalidatePath("/meal");
  return { success: "Request submitted - you'll be notified once it's reviewed." };
}

export async function cancelMealCostRequest(requestId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  await supabase
    .from("meal_cost_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("user_id", profile.id)
    .eq("status", "pending");

  revalidatePath("/meal");
}
