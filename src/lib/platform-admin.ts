import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Platform-level access (cross-cottage), distinct from a cottage's own
 * super_admin role - gated by a plain email allowlist rather than a DB role
 * since there's a single owner today. Add more addresses to
 * PLATFORM_ADMIN_EMAILS (comma-separated) as needed.
 */
function allowedEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email?.toLowerCase();
  if (!email || !allowedEmails().includes(email)) redirect("/dashboard");

  return user;
}
