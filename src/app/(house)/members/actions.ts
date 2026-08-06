"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/data/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";
import { todayInDhaka } from "@/lib/dhaka-date";
import { formatDate } from "@/lib/format-date";

export type InviteMemberState = { error?: string; success?: string } | undefined;

export async function inviteMember(
  _prevState: InviteMemberState,
  formData: FormData
): Promise<InviteMemberState> {
  const admin_ = await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const roomLabel = String(formData.get("room_label") ?? "").trim();
  const role = formData.get("role") === "super_admin" ? "super_admin" : "member";

  if (!email || !firstName) {
    return { error: "First name and email are required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      mode: "join_cottage",
      cottage_id: admin_.cottage_id,
      first_name: firstName,
      last_name: lastName || null,
      role,
    },
  });

  if (error || !data.user) {
    // This email already has an auth account (from this cottage or another
    // one) -- inviteUserByEmail can't create a second one. Look up their
    // existing profile (bypassing RLS, since it may belong to a different
    // cottage) and decide whether they're free to be added here.
    if (error?.code === "email_exists") {
      return handleExistingEmail(admin, email, {
        cottageId: admin_.cottage_id,
        firstName,
        lastName,
        roomLabel,
        role,
      });
    }
    return { error: error?.message ?? "Could not invite member." };
  }

  // handle_new_user only sets id/first_name/last_name/email/role - the
  // permission columns fall back to their table defaults, three of which
  // are `true`. A newly invited member should start as a plain general
  // member with no permissions granted, so zero them out explicitly here.
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      room_label: roomLabel || null,
      can_add_expenses: false,
      can_add_bazaar: false,
      can_add_meals: false,
      can_add_deposit: false,
      can_add_notice: false,
    })
    .eq("id", data.user.id);

  revalidatePath("/members");
  return { success: `Invite sent to ${email}.` };
}

/**
 * A person can only ever belong to one cottage's roster at a time. If their
 * existing account was removed from wherever it used to live (removed_at
 * set), they're free to be attached to this cottage instead; otherwise they
 * still belong somewhere else and this invite must be rejected.
 */
async function handleExistingEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  opts: { cottageId: string; firstName: string; lastName: string; roomLabel: string; role: "super_admin" | "member" }
): Promise<InviteMemberState> {
  const { data: existing } = await admin
    .from("profiles")
    .select("id, cottage_id, removed_at, is_active")
    .eq("email", email)
    .maybeSingle();

  if (!existing) {
    return { error: "A user with this email address has already been registered, but no profile could be found for them." };
  }

  if (!existing.removed_at && existing.cottage_id !== opts.cottageId) {
    return { error: "This person is already involved in another Cottage." };
  }

  if (!existing.removed_at && existing.cottage_id === opts.cottageId) {
    return { error: "This person is already a member of this Cottage." };
  }

  // Free to (re)attach: either removed from this cottage before, or removed
  // from a different one. Re-point them at this cottage with a clean slate.
  const { error } = await admin
    .from("profiles")
    .update({
      cottage_id: opts.cottageId,
      first_name: opts.firstName,
      last_name: opts.lastName || null,
      room_label: opts.roomLabel || null,
      role: opts.role,
      is_active: true,
      removed_at: null,
      can_add_expenses: false,
      can_add_bazaar: false,
      can_add_meals: false,
      can_add_deposit: false,
      can_add_notice: false,
    })
    .eq("id", existing.id);

  if (error) return { error: "Could not add this member to the Cottage." };

  await admin.auth.admin.updateUserById(existing.id, { ban_duration: "none" });

  revalidatePath("/members");
  return { success: `${email} has been added to the Cottage.` };
}

export async function setMemberActive(userId: string, isActive: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddExpenses(userId: string, canAddExpenses: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_expenses: canAddExpenses }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddBazaar(userId: string, canAddBazaar: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_bazaar: canAddBazaar }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddMeals(userId: string, canAddMeals: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_meals: canAddMeals }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddDeposit(userId: string, canAddDeposit: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_deposit: canAddDeposit }).eq("id", userId);
  revalidatePath("/members");
}

export async function setCanAddNotice(userId: string, canAddNotice: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  await supabase.from("profiles").update({ can_add_notice: canAddNotice }).eq("id", userId);
  revalidatePath("/members");
  revalidatePath("/notice-board");
}

export type AssignBazaarDutyState = { error?: string; success?: string } | undefined;

export async function assignBazaarDuty(
  _prevState: AssignBazaarDutyState,
  formData: FormData
): Promise<AssignBazaarDutyState> {
  const admin_ = await requireSuperAdmin();
  const supabase = await createClient();

  const userId = String(formData.get("user_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!userId || !startDate || !endDate) {
    return { error: "Pick a member and a date range." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after the start date." };
  }
  const today = todayInDhaka();
  if (endDate < today) {
    // A duty entirely in the past would insert successfully but never show
    // up anywhere (Members page and Dashboard both only query duties whose
    // end_date hasn't passed yet) - surface that as a validation error
    // instead of a silent no-op the admin would otherwise mistake for a bug.
    return { error: "End date can't be in the past - the duty would never show up anywhere." };
  }

  // No DB constraint prevents two members being assigned overlapping dates,
  // so check for a conflict explicitly - a member can only ever be on duty
  // one at a time. Two plain queries (no embed) - a PostgREST embed here
  // previously caused a full outage elsewhere in the app, not worth the risk
  // for a rarely-hit admin action.
  const { data: conflicts } = await supabase
    .from("bazaar_duties")
    .select("user_id, start_date, end_date")
    .eq("cottage_id", admin_.cottage_id)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (conflicts?.length) {
    const conflict = conflicts[0];
    const { data: conflictMember } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", conflict.user_id)
      .maybeSingle();
    const conflictName = conflictMember
      ? `${conflictMember.first_name}${conflictMember.last_name ? " " + conflictMember.last_name : ""}`
      : "another member";
    return {
      error: `${conflictName} is already assigned ${formatDate(conflict.start_date)} – ${formatDate(conflict.end_date)}. Pick a range that doesn't overlap.`,
    };
  }

  const { error } = await supabase.from("bazaar_duties").insert({
    cottage_id: admin_.cottage_id,
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
    note,
    created_by: admin_.id,
  });

  if (error) return { error: "Could not assign bazaar duty." };

  await notifyUsers(supabase, admin_.cottage_id, [userId], {
    type: "bazaar_duty_assigned",
    title: "You've been assigned bazaar duty",
    body: `${formatDate(startDate)} – ${formatDate(endDate)}${note ? ` - ${note}` : ""}`,
    link: "/members",
  });

  revalidatePath("/members");
  revalidatePath("/dashboard");
  return { success: "Bazaar duty assigned." };
}

export async function removeBazaarDuty(dutyId: string) {
  const admin_ = await requireSuperAdmin();
  const supabase = await createClient();

  // The delete only needs `dutyId`; `duty` is used purely for the
  // post-delete notification, so both run together.
  const [{ data: duty }] = await Promise.all([
    supabase.from("bazaar_duties").select("user_id, start_date, end_date").eq("id", dutyId).single(),
    supabase.from("bazaar_duties").delete().eq("id", dutyId),
  ]);

  if (duty) {
    await notifyUsers(supabase, admin_.cottage_id, [duty.user_id], {
      type: "bazaar_duty_removed",
      title: "A bazaar duty was removed",
      body: `${formatDate(duty.start_date)} – ${formatDate(duty.end_date)} is no longer assigned to you.`,
      link: "/members",
    });
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");
}

export type RemoveMemberState = { error?: string } | undefined;

/**
 * Removes a member from the cottage roster - hides them from the Members
 * page and locks their login - without deleting their profile row or any
 * historical record that references it (expenses, meals, deposits,
 * statements). Only ever called on an already-deactivated member.
 */
export async function removeMember(
  _prevState: RemoveMemberState,
  formData: FormData
): Promise<RemoveMemberState> {
  const admin_ = await requireSuperAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId) return { error: "Missing member." };
  if (userId === admin_.id) return { error: "You can't remove yourself." };
  if (!password) return { error: "Enter your password to confirm." };

  const supabase = await createClient();

  const email = admin_.email ?? (await supabase.auth.getUser()).data.user?.email ?? null;
  if (!email) return { error: "No email on file for this account." };
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password });
  if (reauthError) return { error: "Incorrect password." };

  const { data: target } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single();

  if (!target) return { error: "Member not found." };
  if (target.role === "super_admin") return { error: "Can't remove another admin." };
  if (target.is_active) return { error: "Deactivate this member before removing them." };

  const { error } = await supabase
    .from("profiles")
    .update({ removed_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: "Could not remove the member." };

  // Lock their login without deleting the auth user (deleting it would
  // cascade-delete the profiles row and every record that references it).
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });

  revalidatePath("/members");
  return undefined;
}
