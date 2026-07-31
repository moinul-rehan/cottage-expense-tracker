import { redirect } from "next/navigation";
import { CircleX } from "@/components/animate-ui/icons/circle-x";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Deliberately does NOT call getCurrentProfile() -- that's the function that
// redirects here in the first place, so reusing it would loop.
export default async function RejectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("cottage_id").eq("id", user.id).maybeSingle();
  const { data: cottage } = profile
    ? await admin.from("cottages").select("status, rejected_reason").eq("id", profile.cottage_id).maybeSingle()
    : { data: null };

  if (cottage?.status !== "rejected") redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
        <Logo size={28} />
        Cottage
      </div>
      <div className="flex max-w-sm flex-col items-center gap-3">
        <CircleX className="size-10 text-destructive" />
        <h1 className="text-lg font-semibold text-foreground">This Cottage was not approved</h1>
        <p className="text-sm text-muted-foreground">
          {cottage.rejected_reason || "Contact support if you think this was a mistake."}
        </p>
      </div>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}
