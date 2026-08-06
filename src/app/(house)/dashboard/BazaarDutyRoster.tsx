import { ShoppingBasket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getDisplayName } from "@/lib/data/display-name";
import { formatDate } from "@/lib/format-date";
import { todayInDhaka } from "@/lib/dhaka-date";
import { cn } from "@/lib/utils";
import type { BazaarDuty } from "@/lib/data/bazaar-duty";

type Member = { id: string; first_name: string; last_name: string | null; avatar_url: string | null };

function dutyStatus(startIso: string, endIso: string) {
  const today = todayInDhaka();
  if (startIso <= today && today <= endIso) return "active" as const;
  if (startIso === today) return "today" as const;
  return "upcoming" as const;
}

/** Every member's upcoming/current bazaar duty, one shared roster instead of
 * each member only seeing their own - a compact list of avatar rows rather
 * than the old single full-width "your duty" banner. */
export function BazaarDutyRoster({
  duties,
  membersById,
  currentUserId,
}: {
  duties: BazaarDuty[];
  membersById: Map<string, Member>;
  currentUserId: string;
}) {
  if (!duties.length) return null;

  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-center gap-2.5 p-4 pb-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ShoppingBasket className="size-4" />
        </div>
        <CardTitle className="text-sm font-semibold">Bazaar Duty Roster</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-2 pb-2">
        {duties.map((d) => {
          const member = membersById.get(d.user_id);
          const isMe = d.user_id === currentUserId;
          const status = dutyStatus(d.start_date, d.end_date);

          return (
            <div
              key={d.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2",
                isMe && "bg-accent/60"
              )}
            >
              <Avatar size="sm">
                <AvatarImage src={member?.avatar_url ?? undefined} alt={member ? getDisplayName(member) : ""} />
                <AvatarFallback>{member?.first_name[0]?.toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {member ? getDisplayName(member) : "Member"}
                  {isMe && <span className="text-muted-foreground"> (you)</span>}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatDate(d.start_date)} – {formatDate(d.end_date)}
                  {d.note ? ` · ${d.note}` : ""}
                </span>
              </div>
              {status === "active" && (
                <Badge className="shrink-0 bg-emerald-600/15 text-emerald-600">On duty</Badge>
              )}
              {status === "today" && (
                <Badge className="shrink-0 bg-[#FA9033]/15 text-[#FA9033]">Today</Badge>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
