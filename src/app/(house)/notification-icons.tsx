import {
  Bell,
  Receipt,
  Wallet,
  ShoppingBasket,
  UtensilsCrossed,
  CalendarClock,
  CalendarX,
  CalendarRange,
  RotateCw,
  RotateCcw,
  Trash2,
  Pin,
  Inbox,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  Crown,
  Skull,
  Megaphone,
  Sparkles,
  Wrench,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  notice_posted: Pin,
  meal_request_submitted: Inbox,
  meal_request_approved: CheckCircle2,
  meal_request_rejected: XCircle,
  meal_cost_request_submitted: Inbox,
  meal_cost_request_approved: CheckCircle2,
  meal_cost_request_rejected: XCircle,
  ownership_transferred: Crown,
  cottage_deletion_scheduled: Skull,
  cottage_deletion_cancelled: CheckCircle2,
  utility_adjustment: Receipt,
  utility_adjustment_removed: Trash2,
  utility_expense_credit: Receipt,
  utility_deposit: Wallet,
  bazaar_entry: ShoppingBasket,
  bazaar_duty_assigned: CalendarClock,
  bazaar_duty_removed: CalendarX,
  meal_deposit: Wallet,
  daily_meal: UtensilsCrossed,
  month_created: CalendarRange,
  month_activated: RotateCw,
  utility_month_reset: RotateCcw,
  meal_month_reset: RotateCcw,
  feedback_submitted: MessageSquareWarning,
  platform_feature: Sparkles,
  platform_update: RotateCw,
  platform_announcement: Megaphone,
  platform_maintenance: Wrench,
  platform_alert: TriangleAlert,
};

export function getNotificationIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] ?? Bell;
}

const PLATFORM_TYPE_PREFIX = "platform_";

/** Category label for a platform-admin-sent notification's badge (e.g.
 * "platform_feature" -> "Feature"), or null for regular in-app activity
 * notifications that aren't platform-admin broadcasts at all. Keep in sync
 * with PLATFORM_NOTIFICATION_CATEGORIES in
 * src/app/platform-admin/notifications/categories.ts. */
export function getPlatformCategoryLabel(type: string): string | null {
  if (!type.startsWith(PLATFORM_TYPE_PREFIX)) return null;
  const category = type.slice(PLATFORM_TYPE_PREFIX.length);
  return category.charAt(0).toUpperCase() + category.slice(1);
}
