import {
  LayoutDashboard,
  UtensilsCrossed,
  Zap,
  Users,
  CalendarRange,
  Bell,
  Settings as SettingsIcon,
} from "lucide-react";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import { getActiveMonthKey, defaultDateForMonth } from "@/lib/data/months";
import { VerifiedBadge } from "@/components/verified-badge";
import { MealQuickAddMenu } from "./MealQuickAddMenu";
import { SidebarNavLink } from "./SidebarNavLink";
import { NotificationTray } from "./NotificationTray";
import { ProfileMenu } from "./ProfileMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meal", label: "Meal", icon: UtensilsCrossed },
  { href: "/utilities", label: "Utilities", icon: Zap },
  { href: "/members", label: "Members", icon: Users },
  { href: "/months", label: "Months", icon: CalendarRange },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const [unreadCount, notifications, { data: members }, activeMonthKey] = await Promise.all([
    getUnreadCount(supabase, profile.id),
    getNotifications(supabase, profile.id, 6),
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getActiveMonthKey(supabase, profile.cottage_id),
  ]);
  const defaultDate = defaultDateForMonth(activeMonthKey);

  return (
    <SidebarProvider className="min-h-0 flex-1 bg-background">
      <Sidebar collapsible="icon" className="border-none">
        <SidebarHeader className="gap-14 px-3 py-8">
          <div className="flex items-center justify-between px-2">
            <span className="text-2xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
              Cottage
            </span>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-10 px-3">
          <SidebarMenu className="gap-2.5">
            {memberLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarNavLink
                  href={link.href}
                  label={link.label}
                  icon={<link.icon />}
                  unreadCount={link.href === "/notifications" ? unreadCount : undefined}
                />
                {link.href === "/meal" && (
                  <MealQuickAddMenu
                    members={members ?? []}
                    defaultDate={defaultDate}
                    canAddBazaar={profile.role === "super_admin" || profile.can_add_bazaar}
                    canAddMeals={profile.role === "super_admin" || profile.can_add_meals}
                    canAddDeposit={profile.role === "super_admin"}
                  />
                )}
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarNavLink href="/settings/profile" label="Settings" icon={<SettingsIcon />} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="flex items-center justify-between gap-3 px-8 py-6">
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="flex items-center gap-1.5 truncate text-2xl font-bold text-foreground">
              Welcome, {getDisplayName(profile)}
              <VerifiedBadge
                role={profile.role}
                can_add_expenses={profile.can_add_expenses}
                can_add_bazaar={profile.can_add_bazaar}
                can_add_meals={profile.can_add_meals}
              />
            </span>
            <span className="hidden truncate text-sm text-muted-foreground sm:block">
              Here&apos;s where things stand for{" "}
              {new Date(`${activeMonthKey}-01T00:00:00`).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
              .
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <NotificationTray notifications={notifications} unreadCount={unreadCount} />
            <ProfileMenu
              name={getDisplayName(profile)}
              avatarUrl={profile.avatar_url}
              initial={profile.first_name[0]?.toUpperCase() ?? "?"}
            />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-8 pb-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
