import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Platform-level access (cross-cottage), distinct from a cottage's own
 * super_admin role - gated by a plain email allowlist rather than a DB role
 * since there's a single owner today. Add more addresses to
 * PLATFORM_ADMIN_EMAILS (comma-separated) as needed.
 */
export function platformAdminAllowedEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined) {
  return !!email && platformAdminAllowedEmails().includes(email.toLowerCase());
}

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/platform-admin/login");
  if (!isPlatformAdminEmail(user.email)) redirect("/platform-admin/login");

  return user;
}
