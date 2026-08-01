import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/dal";
import { translate } from "@/lib/i18n/dictionary";
import { PasswordForm } from "./PasswordForm";

export default async function SettingsSecurityPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasPassword = user?.identities?.some((i) => i.provider === "email") ?? false;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{translate(profile.language, "security")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account security.</p>
      </div>

      <PasswordForm hasPassword={hasPassword} />
    </div>
  );
}
