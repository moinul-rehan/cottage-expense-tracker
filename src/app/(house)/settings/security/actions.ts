"use server";

import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState = { error?: string; success?: string } | undefined;

async function userHasPassword(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.identities?.some((i) => i.provider === "email") ?? false;
}

/** First-time password set for accounts that signed up via Google and have
 * never had a password — there's nothing to verify against, so this skips
 * the current-password re-auth step. Re-checks server-side that the account
 * genuinely has no password yet, so this can't be used to bypass re-auth
 * for an account that already has one. */
export async function setInitialPassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  await getCurrentProfile();

  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!newPassword) {
    return { error: "Enter a password." };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Password and confirmation don't match." };
  }

  const supabase = await createClient();

  if (await userHasPassword(supabase)) {
    return { error: "This account already has a password — use Change password instead." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { error: "Could not set password." };
  }

  return { success: "Password set." };
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const profile = await getCurrentProfile();

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Fill in both password fields." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }
  const supabase = await createClient();

  // profiles.email can be stale/empty on older accounts — fall back to the
  // authenticated session's own email, which is always accurate.
  const email = profile.email ?? (await supabase.auth.getUser()).data.user?.email ?? null;
  if (!email) {
    return { error: "No email on file for this account." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (reauthError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { error: "Could not update password." };
  }

  return { success: "Password changed." };
}
