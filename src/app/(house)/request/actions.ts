"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey } from "@/lib/data/months";
import { notifyUsers } from "@/lib/data/notifications";
import { formatDate } from "@/lib/format-date";

async function requireMealManager() {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_meals) {
    throw new Error("Not authorized to review meal requests.");
  }
  return profile;
}

async function requireBazaarManager() {
  const profile = await getCurrentProfile();
  if (profile.role !== "super_admin" && !profile.can_add_bazaar) {
    throw new Error("Not authorized to review meal cost requests.");
  }
  return profile;
}

export async function approveMealRequest(requestId: string) {
  const profile = await requireMealManager();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("meal_requests")
    .select("id, user_id, request_date, lunch, dinner, status")
    .eq("id", requestId)
    .single();

  if (!request || request.status !== "pending") return;

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const { error: upsertError } = await supabase.from("daily_meals").upsert(
    {
      month_key: activeMonthKey,
      user_id: request.user_id,
      meal_date: request.request_date,
      count: request.lunch + request.dinner,
      created_by: profile.id,
    },
    { onConflict: "user_id,meal_date" }
  );

  if (upsertError) return;

  await supabase
    .from("meal_requests")
    .update({ status: "approved", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await notifyUsers(supabase, profile.cottage_id, [request.user_id], {
    type: "meal_request_approved",
    title: "Meal request approved",
    body: `Your request for ${formatDate(request.request_date)} was approved and added to your meal history.`,
    link: "/meal",
  });

  revalidatePath("/request");
  revalidatePath("/meal");
  revalidatePath("/meal/month-details");
  revalidatePath("/dashboard");
}

export async function rejectMealRequest(requestId: string) {
  const profile = await requireMealManager();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("meal_requests")
    .select("id, user_id, request_date, status")
    .eq("id", requestId)
    .single();

  if (!request || request.status !== "pending") return;

  await supabase
    .from("meal_requests")
    .update({ status: "rejected", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await notifyUsers(supabase, profile.cottage_id, [request.user_id], {
    type: "meal_request_rejected",
    title: "Meal request rejected",
    body: `Your request for ${formatDate(request.request_date)} was not approved.`,
    link: "/meal",
  });

  revalidatePath("/request");
}

export async function approveMealCostRequest(requestId: string) {
  const profile = await requireBazaarManager();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("meal_cost_requests")
    .select("id, user_id, entry_date, amount, description, status")
    .eq("id", requestId)
    .single();

  if (!request || request.status !== "pending") return;

  const activeMonthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  // Inserts the bazaar entry AND credits the same amount back into the
  // requester's meal deposit in one atomic call -- same RPC the "Cost
  // deposit to {member}" checkbox on the manual Add Meal Cost form uses.
  const { error: rpcError } = await supabase.rpc("add_bazaar_entry", {
    p_month_key: activeMonthKey,
    p_spent_by: request.user_id,
    p_amount: request.amount,
    p_description: request.description,
    p_entry_date: request.entry_date,
    p_credit_deposit: true,
  });

  if (rpcError) return;

  await supabase
    .from("meal_cost_requests")
    .update({ status: "approved", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await notifyUsers(supabase, profile.cottage_id, [request.user_id], {
    type: "meal_cost_request_approved",
    title: "Meal cost request approved",
    body: `Your ${request.amount.toFixed(2)} tk request for ${formatDate(request.entry_date)} was approved and credited to your deposit.`,
    link: "/meal",
  });

  revalidatePath("/request");
  revalidatePath("/meal");
  revalidatePath("/meal/month-details");
  revalidatePath("/dashboard");
}

export async function rejectMealCostRequest(requestId: string) {
  const profile = await requireBazaarManager();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("meal_cost_requests")
    .select("id, user_id, entry_date, status")
    .eq("id", requestId)
    .single();

  if (!request || request.status !== "pending") return;

  await supabase
    .from("meal_cost_requests")
    .update({ status: "rejected", reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await notifyUsers(supabase, profile.cottage_id, [request.user_id], {
    type: "meal_cost_request_rejected",
    title: "Meal cost request rejected",
    body: `Your meal cost request for ${formatDate(request.entry_date)} was not approved.`,
    link: "/meal",
  });

  revalidatePath("/request");
}
