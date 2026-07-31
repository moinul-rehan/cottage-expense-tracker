"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function approveCottage(cottageId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: cottage } = await admin.from("cottages").select("name, status").eq("id", cottageId).single();
  if (!cottage || cottage.status !== "pending") return;

  await admin
    .from("cottages")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", cottageId);

  const { data: superAdmin } = await admin
    .from("profiles")
    .select("email")
    .eq("cottage_id", cottageId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (superAdmin?.email) {
    await sendEmail({
      to: superAdmin.email,
      subject: `${cottage.name} is approved`,
      html: `<p><strong>${cottage.name}</strong> has been reviewed and approved.</p><p>You and your members can now sign in and start using Cottage.</p>`,
    });
  }

  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export async function rejectCottage(cottageId: string, reason: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: cottage } = await admin.from("cottages").select("name, status").eq("id", cottageId).single();
  if (!cottage || cottage.status !== "pending") return;

  await admin
    .from("cottages")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), rejected_reason: reason.trim() || null })
    .eq("id", cottageId);

  const { data: superAdmin } = await admin
    .from("profiles")
    .select("email")
    .eq("cottage_id", cottageId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (superAdmin?.email) {
    await sendEmail({
      to: superAdmin.email,
      subject: `${cottage.name} was not approved`,
      html: `<p><strong>${cottage.name}</strong> was reviewed and could not be approved.</p>${
        reason.trim() ? `<p>${reason.trim()}</p>` : ""
      }`,
    });
  }

  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

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
