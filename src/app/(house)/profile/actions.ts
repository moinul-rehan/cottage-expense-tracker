"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

const BD_MOBILE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

export type UpdateProfileState = { error?: string; success?: string } | undefined;

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  await getCurrentProfile();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim() || null;
  const gender = String(formData.get("gender") ?? "") || null;
  const hometown = String(formData.get("hometown") ?? "").trim() || null;
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim() || null;

  if (!firstName) {
    return { error: "First name is required." };
  }
  if (gender && !["male", "female", "other"].includes(gender)) {
    return { error: "Pick a valid gender." };
  }
  if (mobileNumber && !BD_MOBILE_REGEX.test(mobileNumber)) {
    return { error: "Enter a valid Bangladeshi mobile number (e.g. 01712345678)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_profile", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_avatar_url: null,
    p_gender: gender,
    p_hometown: hometown,
    p_mobile_number: mobileNumber,
  });

  if (error) {
    return { error: "Could not save your profile." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function updateAvatarUrl(avatarUrl: string) {
  await getCurrentProfile();
  const supabase = await createClient();
  await supabase.rpc("update_own_avatar", { p_avatar_url: avatarUrl });
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

export type ChangePasswordState = { error?: string; success?: string } | undefined;

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
  if (!profile.email) {
    return { error: "No email on file for this account." };
  }

  const supabase = await createClient();

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: profile.email,
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
