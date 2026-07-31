import { UtensilsCrossed, Zap, Inbox, CalendarRange, Contact } from "lucide-react";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { Pin } from "@/components/animate-ui/icons/pin";
import { Users } from "@/components/animate-ui/icons/users";
import { Settings as SettingsIcon } from "@/components/animate-ui/icons/settings";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { getCurrentProfile, getDisplayName } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import { getActiveMonthKey, defaultDateForMonth, formatMonthKey } from "@/lib/data/months";
import { MealQuickAddMenu } from "./MealQuickAddMenu";
import { UtilitiesQuickAddMenu } from "./UtilitiesQuickAddMenu";
import { SidebarNavLink } from "./SidebarNavLink";
import { PageHeader } from "./PageHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { RealtimeRefresher } from "./RealtimeRefresher";
import { Logo } from "@/components/logo";
import { PushPermission } from "@/components/PushPermission";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";

const bottomLinks = [
  { href: "/members", label: "Members", icon: Users },
  { href: "/months", label: "Months", icon: CalendarRange },
  { href: "/contacts", label: "Contact", icon: Contact },
  { href: "/feedback", label: "Feedback", icon: MessageSquareWarning },
];

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const [unreadCount, notifications, { data: members }, activeMonthKey, { data: cottage }] = await Promise.all([
    getUnreadCount(supabase, profile.id),
    getNotifications(supabase, profile.id, 30),
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getActiveMonthKey(supabase, profile.cottage_id),
    supabase.from("cottages").select("name").eq("id", profile.cottage_id).single(),
  ]);
  const defaultDate = defaultDateForMonth(activeMonthKey);
  const canManageMealRequests =
    profile.role === "super_admin" || profile.can_add_meals || profile.can_add_bazaar;

  let pendingRequestCount = 0;
  if (canManageMealRequests) {
    const [mealPending, costPending] = await Promise.all([
      supabase.from("meal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("meal_cost_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    pendingRequestCount = (mealPending.count ?? 0) + (costPending.count ?? 0);
  }

  const topLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/notice-board", label: "Notice Board", icon: Pin },
    ...(canManageMealRequests ? [{ href: "/request", label: "Request", icon: Inbox }] : []),
  ];

  return (
    <SidebarProvider className="min-h-0 flex-1 bg-background">
      <RealtimeRefresher cottageId={profile.cottage_id} userId={profile.id} />
      <Sidebar collapsible="icon" className="border-none">
        <SidebarHeader className="gap-14 px-3 py-8">
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Logo size={32} />
            <span className="text-2xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
              Cottage
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-6 px-3">
          <SidebarMenu className="gap-1">
            {topLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarNavLink href={link.href} label={link.label} icon={<link.icon />} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <div className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center">
                <UtensilsCrossed className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Meal</span>
              </div>
            </SidebarMenuItem>
            <MealQuickAddMenu
              members={members ?? []}
              defaultDate={defaultDate}
              canAddBazaar={profile.role === "super_admin" || profile.can_add_bazaar}
              canAddMeals={profile.role === "super_admin" || profile.can_add_meals}
              canAddDeposit={profile.role === "super_admin" || profile.can_add_deposit}
            />
          </SidebarMenu>

          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <div className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center">
                <Zap className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Utilities</span>
              </div>
            </SidebarMenuItem>
            <UtilitiesQuickAddMenu
              members={members ?? []}
              defaultDate={defaultDate}
              isSuperAdmin={profile.role === "super_admin"}
              canAddExpenses={profile.role === "super_admin" || profile.can_add_expenses}
            />
          </SidebarMenu>

          <SidebarMenu className="gap-1">
            {bottomLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarNavLink href={link.href} label={link.label} icon={<link.icon />} />
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarNavLink href="/settings/profile" label="Settings" icon={<SettingsIcon />} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-background">
        <PageHeader
          profile={profile}
          displayName={getDisplayName(profile)}
          monthLabel={formatMonthKey(activeMonthKey)}
          cottageName={cottage?.name ?? ""}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-4 pb-24 sm:px-8 sm:pt-0 sm:pb-8 xl:px-12">{children}</main>
      </SidebarInset>
      <MobileBottomNav
        members={members ?? []}
        defaultDate={defaultDate}
        canAddBazaar={profile.role === "super_admin" || profile.can_add_bazaar}
        canAddMeals={profile.role === "super_admin" || profile.can_add_meals}
        canAddDeposit={profile.role === "super_admin" || profile.can_add_deposit}
        canAddExpenses={profile.role === "super_admin" || profile.can_add_expenses}
        isSuperAdmin={profile.role === "super_admin"}
        pendingRequestCount={pendingRequestCount}
      />
      <PushPermission />
    </SidebarProvider>
  );
}
