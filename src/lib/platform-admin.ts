import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Platform-level access (cross-cottage), distinct from a cottage's own
 * super_admin role. There are two tiers:
 *  - "owner": a plain env allowlist (PLATFORM_ADMIN_EMAILS, comma-separated)
 *    - full power, including inviting/removing moderators.
 *  - "moderator": DB-backed (platform_moderators table) - full power over
 *    every Cottage/member/notification/feedback the same as an owner, EXCEPT
 *    managing moderators themselves.
 * requirePlatformAdmin() allows either tier (used by every existing
 * platform-admin page); requirePlatformOwner() is owner-only, used solely by
 * the Moderators management page/actions.
 */
export function platformAdminAllowedEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformOwnerEmail(email: string | null | undefined) {
  return !!email && platformAdminAllowedEmails().includes(email.toLowerCase());
}

/** @deprecated use isPlatformOwnerEmail - kept as an alias since this name is
 * referenced from a few call sites that mean "owner" specifically. */
export const isPlatformAdminEmail = isPlatformOwnerEmail;

export async function isPlatformModeratorEmail(email: string | null | undefined) {
  if (!email) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_moderators")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  return !!data;
}

export async function isPlatformStaffEmail(email: string | null | undefined) {
  return isPlatformOwnerEmail(email) || (await isPlatformModeratorEmail(email));
}

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/platform-admin/login");
  if (!(await isPlatformStaffEmail(user.email))) redirect("/platform-admin/login");

  return { ...user, isOwner: isPlatformOwnerEmail(user.email) };
}

export async function requirePlatformOwner() {
  const user = await requirePlatformAdmin();
  if (!user.isOwner) redirect("/platform-admin");
  return user;
}
