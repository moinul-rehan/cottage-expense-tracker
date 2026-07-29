"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyUsers } from "@/lib/data/notifications";
import { sendEmail } from "@/lib/email";
import { formatDate } from "@/lib/format-date";

type ActionState = { error?: string; success?: string } | undefined;

async function reauth(password: string) {
  const admin_ = await requireSuperAdmin();
  if (!password) return { admin: null, error: "Enter your password to confirm." as const };

  const supabase = await createClient();
  const email = admin_.email ?? (await supabase.auth.getUser()).data.user?.email ?? null;
  if (!email) return { admin: null, error: "No email on file for this account." as const };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { admin: null, error: "Incorrect password." as const };

  return { admin: admin_, error: null };
}

export async function transferOwnership(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const { admin, error: reauthError } = await reauth(password);
  if (!admin) return { error: reauthError };

  const newSuperAdminId = String(formData.get("new_super_admin_id") ?? "");
  if (!newSuperAdminId) return { error: "Select a member to transfer ownership to." };
  if (newSuperAdminId === admin.id) return { error: "You're already the super admin." };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id, role, is_active, cottage_id, first_name, last_name")
    .eq("id", newSuperAdminId)
    .single();

  if (!target || target.cottage_id !== admin.cottage_id) return { error: "Member not found." };
  if (!target.is_active) return { error: "Activate this member before transferring ownership to them." };
  if (target.role === "super_admin") return { error: "This member is already the super admin." };

  const { error: promoteError } = await supabase
    .from("profiles")
    .update({ role: "super_admin" })
    .eq("id", newSuperAdminId);
  if (promoteError) return { error: "Could not transfer ownership." };

  await supabase.from("profiles").update({ role: "member" }).eq("id", admin.id);

  await notifyUsers(supabase, admin.cottage_id, [newSuperAdminId], {
    type: "ownership_transferred",
    title: "You're now the Cottage super admin",
    body: "Ownership was transferred to you. You now have full admin access.",
    link: "/dashboard",
  });
  await notifyUsers(supabase, admin.cottage_id, [admin.id], {
    type: "ownership_transferred",
    title: "You transferred Cottage ownership",
    body: `You're now a regular member. ${target.first_name} is the new super admin.`,
    link: "/dashboard",
  });

  revalidatePath("/settings/cottage");
  revalidatePath("/members");
  return { success: "Ownership transferred." };
}

export async function requestCottageDeletion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const { admin, error: reauthError } = await reauth(password);
  if (!admin) return { error: reauthError };

  const supabase = await createClient();
  const admin_client = createAdminClient();

  const { data: cottage } = await supabase.from("cottages").select("name").eq("id", admin.cottage_id).single();
  if (!cottage) return { error: "Cottage not found." };

  const now = new Date();
  const deletionDate = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  const { data: notice, error: noticeError } = await supabase
    .from("notices")
    .insert({
      cottage_id: admin.cottage_id,
      title: "Cottage deletion scheduled",
      description: `${cottage.name} is scheduled for permanent deletion on ${formatDate(deletionDate)}. All data will be permanently erased. Only the super admin can cancel this, from Settings -> Cottage Profile, before then.`,
      type: "emergency",
      priority: "critical",
      visibility: "everyone",
      is_pinned: true,
      pin_duration: "until_expires",
      publish_at: now.toISOString(),
      expires_at: deletionDate.toISOString(),
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (noticeError || !notice) return { error: "Could not schedule the deletion." };

  const { error: updateError } = await supabase
    .from("cottages")
    .update({
      deletion_requested_at: now.toISOString(),
      deletion_requested_by: admin.id,
      deletion_notice_id: notice.id,
    })
    .eq("id", admin.cottage_id);
  if (updateError) return { error: "Could not schedule the deletion." };

  const { data: members } = await admin_client
    .from("profiles")
    .select("id, email")
    .eq("cottage_id", admin.cottage_id)
    .eq("is_active", true);

  const memberIds = (members ?? []).map((m) => m.id);
  await notifyUsers(supabase, admin.cottage_id, memberIds, {
    type: "cottage_deletion_scheduled",
    title: "Cottage deletion scheduled",
    body: `${cottage.name} will be permanently deleted on ${formatDate(deletionDate)} unless the super admin cancels it.`,
    link: "/dashboard",
  });

  await Promise.all(
    (members ?? [])
      .filter((m) => m.email)
      .map((m) =>
        sendEmail({
          to: m.email!,
          subject: `${cottage.name}: deletion scheduled`,
          html: `<p><strong>${cottage.name}</strong> has been scheduled for permanent deletion on <strong>${formatDate(deletionDate)}</strong>.</p><p>All data (expenses, meals, notices, everything) will be permanently erased at that time. Only the super admin can cancel this before then, from Settings &rarr; Cottage Profile in the app.</p>`,
        })
      )
  );

  revalidatePath("/settings/cottage");
  revalidatePath("/dashboard");
  return { success: "Deletion scheduled." };
}

export async function cancelCottageDeletion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const { admin, error: reauthError } = await reauth(password);
  if (!admin) return { error: reauthError };

  const supabase = await createClient();
  const admin_client = createAdminClient();

  const { data: cottage } = await supabase
    .from("cottages")
    .select("name, deletion_notice_id")
    .eq("id", admin.cottage_id)
    .single();
  if (!cottage) return { error: "Cottage not found." };

  if (cottage.deletion_notice_id) {
    await supabase.from("notices").update({ archived_at: new Date().toISOString() }).eq("id", cottage.deletion_notice_id);
  }

  await supabase
    .from("cottages")
    .update({ deletion_requested_at: null, deletion_requested_by: null, deletion_notice_id: null })
    .eq("id", admin.cottage_id);

  const { data: members } = await admin_client
    .from("profiles")
    .select("id, email")
    .eq("cottage_id", admin.cottage_id)
    .eq("is_active", true);

  const memberIds = (members ?? []).map((m) => m.id);
  await notifyUsers(supabase, admin.cottage_id, memberIds, {
    type: "cottage_deletion_cancelled",
    title: "Cottage deletion cancelled",
    body: `The scheduled deletion of ${cottage.name} was cancelled by the super admin.`,
    link: "/dashboard",
  });

  await Promise.all(
    (members ?? [])
      .filter((m) => m.email)
      .map((m) =>
        sendEmail({
          to: m.email!,
          subject: `${cottage.name}: deletion cancelled`,
          html: `<p>The scheduled deletion of <strong>${cottage.name}</strong> has been cancelled. Nothing was deleted.</p>`,
        })
      )
  );

  revalidatePath("/settings/cottage");
  revalidatePath("/dashboard");
  return { success: "Deletion cancelled." };
}
