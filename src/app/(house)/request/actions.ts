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
