import { UtensilsCrossed, Zap, Inbox, CalendarRange, Contact } from "lucide-react";
import { LayoutDashboard } from "@/components/animate-ui/icons/layout-dashboard";
import { Pin } from "@/components/animate-ui/icons/pin";
import { Users } from "@/components/animate-ui/icons/users";
import { Settings as SettingsIcon } from "@/components/animate-ui/icons/settings";
import { MessageSquareWarning } from "@/components/animate-ui/icons/message-square-warning";
import { getCurrentProfile, getDisplayName, getActiveMembers } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount, getNotifications } from "@/lib/data/notifications";
import { defaultDateForMonth, formatMonthKey } from "@/lib/data/months";
import { translate } from "@/lib/i18n/dictionary";
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

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const canManageMealRequests =
    profile.role === "super_admin" || profile.can_add_meals || profile.can_add_bazaar;

  const [unreadCount, notifications, members, mealPending, costPending] = await Promise.all([
    getUnreadCount(supabase, profile.id),
    getNotifications(supabase, profile.id, 30),
    getActiveMembers(profile.cottage_id),
    canManageMealRequests
      ? supabase.from("meal_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    canManageMealRequests
      ? supabase.from("meal_cost_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);
  const defaultDate = defaultDateForMonth(profile.active_month_key);
  const pendingRequestCount = (mealPending.count ?? 0) + (costPending.count ?? 0);
  const lang = profile.language;
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);

  const topLinks = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/notice-board", label: t("notice_board"), icon: Pin },
    ...(canManageMealRequests ? [{ href: "/request", label: t("request"), icon: Inbox }] : []),
  ];

  const bottomLinks = [
    { href: "/members", label: t("members"), icon: Users },
    { href: "/months", label: t("months"), icon: CalendarRange },
    { href: "/contacts", label: t("contact"), icon: Contact },
    { href: "/feedback", label: t("feedback"), icon: MessageSquareWarning },
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
                <span className="group-data-[collapsible=icon]:hidden">{t("meal")}</span>
              </div>
            </SidebarMenuItem>
            <MealQuickAddMenu
              members={members}
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
                <span className="group-data-[collapsible=icon]:hidden">{t("utilities")}</span>
              </div>
            </SidebarMenuItem>
            <UtilitiesQuickAddMenu
              members={members}
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
              <SidebarNavLink href="/settings/profile" label={t("settings")} icon={<SettingsIcon />} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="bg-background">
        <PageHeader
          profile={profile}
          displayName={getDisplayName(profile)}
          monthLabel={formatMonthKey(profile.active_month_key)}
          cottageName={profile.cottage_name}
          notifications={notifications}
          unreadCount={unreadCount}
          lang={lang}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-4 pb-24 sm:px-8 sm:pt-0 sm:pb-8 xl:px-12">{children}</main>
      </SidebarInset>
      <MobileBottomNav
        members={members}
        defaultDate={defaultDate}
        canAddBazaar={profile.role === "super_admin" || profile.can_add_bazaar}
        canAddMeals={profile.role === "super_admin" || profile.can_add_meals}
        canAddDeposit={profile.role === "super_admin" || profile.can_add_deposit}
        canAddExpenses={profile.role === "super_admin" || profile.can_add_expenses}
        isSuperAdmin={profile.role === "super_admin"}
        pendingRequestCount={pendingRequestCount}
        lang={lang}
      />
      <PushPermission />
    </SidebarProvider>
  );
}
