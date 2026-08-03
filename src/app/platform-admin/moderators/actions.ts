"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requirePlatformOwner, isPlatformOwnerEmail } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteModeratorState = { error?: string; success?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteModerator(
  _prevState: InviteModeratorState,
  formData: FormData
): Promise<InviteModeratorState> {
  const owner = await requirePlatformOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (isPlatformOwnerEmail(email)) return { error: "That address is already a platform owner." };

  const admin = createAdminClient();

  const { data: existing } = await admin.from("platform_moderators").select("id").ilike("email", email).maybeSingle();
  if (existing) return { error: "That address is already a moderator." };

  // Same redirect pattern as forgot-password/actions.ts: NEXT_PUBLIC_SITE_URL
  // must match an entry in Supabase's Auth -> URL Configuration -> Redirect
  // URLs allow list exactly, or Supabase silently drops the path and falls
  // back to its bare Site URL. mode=recovery reuses the same
  // /auth/callback branch as password-reset -- it just persists the session
  // and sends them to /reset-password, without touching cottage/profile
  // logic (a moderator may not be a Cottage member at all).
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?mode=recovery`,
  });

  // "User already registered" isn't a failure here -- they already have a
  // Supabase account (e.g. a Cottage member elsewhere), so they can sign in
  // to /platform-admin/login with their existing password as soon as the
  // moderators row below exists; there's no invite email to send.
  if (inviteError && !/already.*registered/i.test(inviteError.message)) {
    return { error: `Could not send the invite: ${inviteError.message}` };
  }

  const { error: insertError } = await admin
    .from("platform_moderators")
    .insert({ email, invited_by: owner.id });
  if (insertError) return { error: "Could not save that moderator." };

  revalidatePath("/platform-admin/moderators");
  return { success: `Invited ${email} as a platform moderator.` };
}

export async function removeModerator(id: string) {
  await requirePlatformOwner();
  const admin = createAdminClient();
  await admin.from("platform_moderators").delete().eq("id", id);
  revalidatePath("/platform-admin/moderators");
}
