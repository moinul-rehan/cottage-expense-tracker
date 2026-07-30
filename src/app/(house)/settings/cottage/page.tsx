import { requireSuperAdmin } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransferOwnershipCard, DeleteCottageCard, PendingDeletionBanner, CottageNameForm } from "./CottageProfileControls";

export default async function CottageProfilePage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();

  const [{ data: cottage }, { data: members }] = await Promise.all([
    supabase
      .from("cottages")
      .select("name, created_at, deletion_requested_at")
      .eq("id", profile.cottage_id)
      .single(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("cottage_id", profile.cottage_id)
      .eq("is_active", true)
      .neq("id", profile.id)
      .order("last_name"),
  ]);

  if (!cottage) return null;

  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("cottage_id", profile.cottage_id);

  const deletionPending = !!cottage.deletion_requested_at;
  const deletionDate = deletionPending
    ? new Date(new Date(cottage.deletion_requested_at!).getTime() + 7 * 24 * 3600 * 1000).toISOString()
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Cottage Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage this Cottage's identity, ownership, and lifecycle.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Name</p>
            <CottageNameForm name={cottage.name} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="font-medium text-foreground">{formatDate(cottage.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-medium text-foreground">{memberCount ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      {deletionPending && deletionDate ? (
        <PendingDeletionBanner cottageName={cottage.name} deletionDate={deletionDate} />
      ) : (
        <>
          <TransferOwnershipCard members={members ?? []} />
          <DeleteCottageCard cottageName={cottage.name} />
        </>
      )}
    </div>
  );
}
