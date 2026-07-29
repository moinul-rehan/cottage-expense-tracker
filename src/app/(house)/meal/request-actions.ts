"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import { formatDate } from "@/lib/format-date";

export type MealRequestState = { error?: string; success?: string } | undefined;

export async function submitMealRequest(
  _prevState: MealRequestState,
  formData: FormData
): Promise<MealRequestState> {
  const profile = await getCurrentProfile();
  if (profile.role === "super_admin" || profile.can_add_meals) {
    return { error: "You can already log meals directly — no need to request one." };
  }

  const requestDate = String(formData.get("request_date") ?? "");
  const lunch = Number(formData.get("lunch") ?? 0) || 0;
  const dinner = Number(formData.get("dinner") ?? 0) || 0;

  if (!requestDate) return { error: "Pick a date." };
  if (lunch <= 0 && dinner <= 0) return { error: "Enter at least one meal count." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("meal_requests")
    .select("id")
    .eq("user_id", profile.id)
    .eq("request_date", requestDate)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "You already have a pending request for this date." };
  }

  const { error } = await supabase.from("meal_requests").insert({
    cottage_id: profile.cottage_id,
    user_id: profile.id,
    request_date: requestDate,
    lunch,
    dinner,
  });

  if (error) return { error: "Could not submit the request." };

  const { data: managers } = await supabase
    .from("profiles")
    .select("id")
    .eq("cottage_id", profile.cottage_id)
    .eq("is_active", true)
    .or("role.eq.super_admin,can_add_meals.eq.true");

  await notifyUsers(
    supabase,
    profile.cottage_id,
    (managers ?? []).map((m) => m.id).filter((id) => id !== profile.id),
    {
      type: "meal_request_submitted",
      title: "New meal request",
      body: `${profile.first_name} requested ${lunch + dinner} meal${lunch + dinner === 1 ? "" : "s"} on ${formatDate(requestDate)}.`,
      link: "/request",
    }
  );

  revalidatePath("/meal");
  return { success: "Request submitted — you'll be notified once it's reviewed." };
}

export async function cancelMealRequest(requestId: string) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  await supabase
    .from("meal_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("user_id", profile.id)
    .eq("status", "pending");

  revalidatePath("/meal");
}
