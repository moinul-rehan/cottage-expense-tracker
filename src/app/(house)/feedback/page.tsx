import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { translate } from "@/lib/i18n/dictionary";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/format-date";
import { FeedbackForm } from "./FeedbackForm";

export default async function FeedbackPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: feedback }, { data: members }] = await Promise.all([
    supabase
      .from("developer_feedback")
      .select("id, title, description, image_url, created_at, user_id")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, first_name, last_name, avatar_url"),
  ]);
  const membersById = new Map((members ?? []).map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {translate(profile.language, "feedback_to_developer")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Found a bug or have a suggestion? Let the developer know, screenshots help.
        </p>
      </div>

      <FeedbackForm userId={profile.id} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          {profile.role === "super_admin" ? "All feedback" : "Your feedback"}
        </h2>
        <div className="flex flex-col gap-3">
          {(feedback ?? []).map((f) => {
            const author = membersById.get(f.user_id);
            return (
              <Card key={f.id} className="p-4">
                <CardContent className="flex flex-col gap-2 p-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarImage src={author?.avatar_url ?? undefined} alt={author ? getDisplayName(author) : ""} />
                      <AvatarFallback>{author?.first_name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{f.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {author ? getDisplayName(author) : "Unknown"} · {formatDateTime(f.created_at)}
                      </p>
                    </div>
                  </div>
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
            <Card className="p-4 text-sm text-muted-foreground">No feedback submitted yet.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
