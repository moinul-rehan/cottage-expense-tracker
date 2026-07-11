import { requireSuperAdmin, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRents, getDefaultCosts } from "@/lib/data/finance";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";
import { RentRow } from "./RentRow";
import { DefaultCostForm } from "./DefaultCostForm";
import { DeleteDefaultCostButton } from "./DeleteDefaultCostButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RentPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: members }, currentRents, defaultCosts] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, room_label")
      .eq("is_active", true)
      .order("last_name"),
    getCurrentRents(supabase),
    getDefaultCosts(supabase, profile.cottage_id),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Default Cost</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set each member&apos;s fixed monthly costs — rent, and any other utility that&apos;s the
          same every month. These auto-fill when generating the Utility Statement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">House Rent</CardTitle>
        </CardHeader>
        <CardContent>
          {members?.map((member) => (
            <RentRow
              key={member.id}
              userId={member.id}
              name={getDisplayName(member)}
              roomLabel={member.room_label}
              currentAmount={currentRents.get(member.id)?.monthly_rent_amount ?? null}
            />
          ))}
          {!members?.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No active members yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Other Default Costs</CardTitle>
          <DefaultCostForm members={members ?? []} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from(defaultCosts.entries()).map(([category, rows]) => (
            <div key={category} className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {UTILITY_CATEGORY_LABELS[category] ?? category}
                </p>
                <DeleteDefaultCostButton category={category} />
              </div>
              <div className="flex flex-col gap-1">
                {rows.map((row) => (
                  <div key={row.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {membersById.get(row.user_id) ? getDisplayName(membersById.get(row.user_id)!) : "Former member"}
                    </span>
                    <span className="font-medium text-foreground">{row.amount.toFixed(2)} tk</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!defaultCosts.size && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No default costs set yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
