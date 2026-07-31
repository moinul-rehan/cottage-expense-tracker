import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDisplayName } from "@/lib/data/display-name";
import { formatDateTime } from "@/lib/format-date";
import { AdminShell } from "../AdminShell";
import { AdminCard } from "../AdminUI";

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
    <AdminShell title="Feedback">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Feedback</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">Bug reports and suggestions from every Cottage.</p>
        </div>

        <div className="flex flex-col gap-3">
          {(feedback ?? []).map((f) => {
            const author = memberById.get(f.user_id);
            const cottageName = cottageNameById.get(f.cottage_id);
            return (
              <AdminCard key={f.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{f.title}</p>
                  <span className="shrink-0 text-xs text-black/40 dark:text-white/40">{formatDateTime(f.created_at)}</span>
                </div>
                <p className="text-xs text-black/40 dark:text-white/40">
                  {cottageName ?? "Unknown Cottage"} · {author ? getDisplayName(author) : "Unknown member"}
                </p>
                <p className="text-sm whitespace-pre-wrap">{f.description}</p>
                {f.image_url && (
                  <a href={f.image_url} target="_blank" rel="noreferrer" className="mt-1 w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.image_url}
                      alt="Attached screenshot"
                      className="max-h-48 rounded-lg border-[0.5px] border-black/10 object-cover dark:border-white/10"
                    />
                  </a>
                )}
              </AdminCard>
            );
          })}
          {!feedback?.length && (
            <AdminCard className="p-4 text-sm text-black/40 dark:text-white/40">No feedback submitted yet.</AdminCard>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
