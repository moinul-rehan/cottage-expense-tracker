import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformStaffEmail } from "@/lib/platform-admin";
import { Logo } from "@/components/logo";
import { PlatformAdminLoginForm } from "./PlatformAdminLoginForm";

export default async function PlatformAdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (await isPlatformStaffEmail(user.email))) {
    redirect("/platform-admin");
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Logo size={28} />
          Platform Admin
        </div>
        <PlatformAdminLoginForm />
      </div>
    </div>
  );
}
