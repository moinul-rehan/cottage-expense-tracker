import { getCurrentProfile } from "@/lib/data/dal";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile & Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal info and account security.
        </p>
      </div>

      <ProfileForm
        key={[profile.first_name, profile.last_name, profile.gender, profile.hometown, profile.mobile_number].join("|")}
        profile={profile}
      />
      <PasswordForm />
    </div>
  );
}
