import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDisplayName } from "@/lib/data/display-name";
import { formatDateTime } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformAdminNav } from "../PlatformAdminNav";

export default async function PlatformAdminFeedbackPage() {
  await requirePlatformAdmin();

  const admin = createAdminClient();
  const [{ data: feedback }, { data: members }, { data: cottages }] = await Promise.all([
    admin
      .from("developer_feedback")
      .select("id, title, description, image_url, created_at, user_id, cottage_id")
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("profiles").select("id, first_name, last_name"),
    admin.from("cottages").select("id, name"),
  ]);
  const memberById = new Map((members ?? []).map((m) => [m.id, m]));
  const cottageNameById = new Map((cottages ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <PlatformAdminNav />

      <div>
        <h1 className="text-xl font-semibold text-foreground">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bug reports and suggestions from every Cottage.</p>
      </div>

      <div className="flex flex-col gap-3">
        {(feedback ?? []).map((f) => {
          const author = memberById.get(f.user_id);
          const cottageName = cottageNameById.get(f.cottage_id);
          return (
            <Card key={f.id} className="rounded-2xl p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(f.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cottageName ?? "Unknown Cottage"} · {author ? getDisplayName(author) : "Unknown member"}
                </p>
                <p className="text-sm whitespace-pre-wrap text-foreground">{f.description}</p>
                {f.image_url && (
                  <a href={f.image_url} target="_blank" rel="noreferrer" className="mt-1 w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image_url}
                      alt="Attached screenshot"
                      className="max-h-48 rounded-lg border border-border object-cover"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!feedback?.length && (
          <Card className="rounded-2xl p-4 text-sm text-muted-foreground">No feedback submitted yet.</Card>
        )}
      </div>
    </div>
  );
}
