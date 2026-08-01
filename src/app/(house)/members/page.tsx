import { getCurrentProfile } from "@/lib/data/dal";
import { translate } from "@/lib/i18n/dictionary";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingBazaarDuties } from "@/lib/data/bazaar-duty";
import { InviteForm } from "./InviteForm";
import { MemberCard } from "./MemberCard";
import { Card } from "@/components/ui/card";

export default async function MembersPage() {
  const profile = await getCurrentProfile();
  const isSuperAdmin = profile.role === "super_admin";
  const supabase = await createClient();

  const [{ data: members }, duties] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, avatar_url, role, room_label, is_active, email, mobile_number, hometown, address, can_add_expenses, can_add_bazaar, can_add_meals, can_add_deposit, can_add_notice"
      )
      .is("removed_at", null)
      .order("last_name"),
    getUpcomingBazaarDuties(supabase, profile.cottage_id),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));
  const allDuties = Array.from(duties.values())
    .flat()
    .map((d) => ({
      ...d,
      memberName: membersById.get(d.user_id)
        ? `${membersById.get(d.user_id)!.first_name}${membersById.get(d.user_id)!.last_name ? " " + membersById.get(d.user_id)!.last_name : ""}`
        : "Another member",
    }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{translate(profile.language, "members")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Invite Cottage members and manage who has access."
            : "Everyone in the Cottage."}
        </p>
      </div>

      {isSuperAdmin && <InviteForm />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {members?.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            duties={duties.get(member.id) ?? []}
            otherDuties={allDuties.filter((d) => d.user_id !== member.id)}
            viewerIsAdmin={isSuperAdmin}
          />
        ))}
        {!members?.length && (
          <Card className="p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No members yet.
          </Card>
        )}
      </div>
    </div>
  );
}
