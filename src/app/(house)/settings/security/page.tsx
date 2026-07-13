import { createClient } from "@/lib/supabase/server";
import { PasswordForm } from "./PasswordForm";

export default async function SettingsSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasPassword = user?.identities?.some((i) => i.provider === "email") ?? false;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account security.</p>
      </div>

      <PasswordForm hasPassword={hasPassword} />
    </div>
  );
}
