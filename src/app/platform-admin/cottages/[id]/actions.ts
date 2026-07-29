"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateCottagePlan(cottageId: string, plan: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin.from("cottages").update({ plan }).eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
}

export async function updateCottageSubscriptionStatus(cottageId: string, subscriptionStatus: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin.from("cottages").update({ subscription_status: subscriptionStatus }).eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
}

export async function suspendCottage(cottageId: string, reason: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin
    .from("cottages")
    .update({ suspended_at: new Date().toISOString(), suspended_reason: reason.trim() || null })
    .eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export async function reactivateCottage(cottageId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin.from("cottages").update({ suspended_at: null, suspended_reason: null }).eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export type DeleteCottageState = { error?: string } | undefined;

export async function deleteCottage(
  _prevState: DeleteCottageState,
  formData: FormData
): Promise<DeleteCottageState> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const cottageId = String(formData.get("cottage_id") ?? "");
  const confirmName = String(formData.get("confirm_name") ?? "").trim();

  const { data: cottage } = await admin.from("cottages").select("name").eq("id", cottageId).single();
  if (!cottage) return { error: "Cottage not found." };
  if (confirmName !== cottage.name) return { error: "Name doesn't match -- type it exactly as shown." };

  const { error } = await admin.from("cottages").delete().eq("id", cottageId);
  if (error) return { error: "Could not delete the Cottage." };

  redirect("/platform-admin");
}
