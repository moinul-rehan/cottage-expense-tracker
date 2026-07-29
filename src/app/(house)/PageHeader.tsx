"use client";

import { usePathname } from "next/navigation";
import { NotificationTray } from "./NotificationTray";
import { ProfileMenu } from "./ProfileMenu";
import { VerifiedBadge } from "@/components/verified-badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocalClock } from "@/components/LocalClock";
import { Logo } from "@/components/logo";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Profile = {
  role: "super_admin" | "member";
  avatar_url: string | null;
  first_name: string;
  can_add_expenses: boolean;
  can_add_bazaar: boolean;
  can_add_meals: boolean;
  can_add_deposit: boolean;
  can_add_notice: boolean;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function PageHeader({
  profile,
  displayName,
  monthLabel,
  cottageName,
  notifications,
  unreadCount,
}: {
  profile: Profile;
  displayName: string;
  monthLabel: string;
  cottageName: string;
  notifications: Notification[];
  unreadCount: number;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8 sm:py-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="hidden shrink-0 md:inline-flex" />

        {isDashboard && (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <Logo size={42} />
              <div className="flex items-center gap-2.5">
                <ThemeToggle />
                <NotificationTray notifications={notifications} unreadCount={unreadCount} />
                <ProfileMenu
                  name={displayName}
                  avatarUrl={profile.avatar_url}
                  initial={profile.first_name[0]?.toUpperCase() ?? "?"}
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="flex items-center gap-1.5 truncate text-lg font-bold text-foreground">
                Welcome, {displayName}
                <VerifiedBadge
                  role={profile.role}
                  can_add_expenses={profile.can_add_expenses}
                  can_add_bazaar={profile.can_add_bazaar}
                  can_add_meals={profile.can_add_meals}
                  can_add_deposit={profile.can_add_deposit}
                  can_add_notice={profile.can_add_notice}
                />
              </span>
              {cottageName && (
                <span className="truncate text-xs font-medium text-muted-foreground">{cottageName}</span>
              )}
              <span className="truncate text-sm text-muted-foreground">
                Here&apos;s where things stand for {monthLabel}.
              </span>
            </div>
          </div>
        )}

        {isDashboard && (
          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="flex items-center gap-1.5 truncate text-xl font-bold text-foreground sm:text-2xl">
              Welcome, {displayName}
              <VerifiedBadge
                role={profile.role}
                can_add_expenses={profile.can_add_expenses}
                can_add_bazaar={profile.can_add_bazaar}
                can_add_meals={profile.can_add_meals}
                can_add_deposit={profile.can_add_deposit}
                can_add_notice={profile.can_add_notice}
              />
            </span>
            {cottageName && (
              <span className="truncate text-xs font-medium text-muted-foreground">{cottageName}</span>
            )}
            <span className="truncate text-sm text-muted-foreground">
              Here&apos;s where things stand for {monthLabel}.
            </span>
          </div>
        )}
      </div>

      {isDashboard && (
        <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
          <LocalClock />
          <ThemeToggle />
          <NotificationTray notifications={notifications} unreadCount={unreadCount} />
          <ProfileMenu
            name={displayName}
            avatarUrl={profile.avatar_url}
            initial={profile.first_name[0]?.toUpperCase() ?? "?"}
          />
        </div>
      )}
    </header>
  );
}
